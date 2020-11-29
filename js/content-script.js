infoLog('这是content script!');

// 注意，必须设置了run_at=document_start 此段代码才会生效

var publicVariety;
const src = chrome.extension.getURL('js/public-variety.js');

const addImg = chrome.extension.getURL('img/add.png');
const delImg = chrome.extension.getURL('img/del.png');
const editImg = chrome.extension.getURL('img/edit.png');
(async () => {
	publicVariety = await import(src);
	setTimeout(function() {
		initCustomPanel();
	}, 3000);
})();

document.addEventListener('DOMContentLoaded', function() {

});

//正式地址
var url_header = '/ngmss-mem/member/option/';
var get_time_url = '/getTime';

//测试地址
//var url_header = '/newGrabController/ngmss-mem/member/option/';
//var get_time_url = '/newGrabController/getTime';

//优先级上限
var priority_limit_num = 10;
//提前获取仓单列表毫秒数
var g_advance_get_sheet_list_ms = 10000; //倒计时10秒时获取仓单列表
//提前抢单毫秒数
var g_advance_start_scan_ms = 350; //提前400ms开始抢单
//提前抢单间隔毫秒数
var g_advance_interval_scan_ms = 10; //10MS间隔
//单轮最大尝试次数 该值应大于 g_advance_start_scan_ms/g_advance_interval_scan_ms
var try_count_limit_times = 100;

var g_memory_conditions = [];
var g_condition_addable = true;
var g_draw = 1;
var g_reqid_priority_match = [];
//ready方法是否执行锅
var ready_exe_flag = false;
//展示结果
let displayResult = false;
//展示编辑
let editFlag = false;

var detailBtnEnable = true;
//存本地变量
function saveLocalStorage(json) {
	var stored_string = window.localStorage['fullauto_pick']
	if (!stored_string) {
		stored_string = '{}';
	}
	var old_json = JSON.parse(stored_string);
	$.extend(true, old_json, json);
	window.localStorage['fullauto_pick'] = JSON.stringify(old_json)
}

function getStroredJson() {
	var stored_string = window.localStorage['fullauto_pick'];
	if (!stored_string) {
		return null;
	}
	return JSON.parse(stored_string);
}

//根据仓单编号获取对应匹配到的条件编号
function getConditionNum(request_id) {
	var ret = null;
	$.each(g_reqid_priority_match, function(i, v) {
		if (parseInt(v['request_id']) == parseInt(request_id)) {
			ret = v['condition_num'];
		}
	});
	return ret;
}


//在倒计时10秒时执行，获取仓单列表，放入内存ready
function ready() {
	var stroredJson = getStroredJson();
	detailBtnEnable = false;
	var variety = stroredJson['current_variety'];
	var commodity_id = stroredJson[variety]['commodity_id'];
	var round_number = stroredJson[variety]['round_number'];
	g_condition_addable = false;
	$('#variety')[0].innerHTML += '&nbsp已停止增减条件';
	let param = publicVariety.getParam(variety, commodity_id, round_number);
	let r = Math.random();
	$.ajax({
		"url": url_header + "getSheetList?r=" + r,
		"type": "POST",
		"dataType": 'json',
		"contentType": 'application/json',
		"data": JSON.stringify(param),
		"async": false,
		"success": function(data) {
			orderWarehouse(data);

			$('#process')[0].innerHTML += '获取仓单列表完成</br>';
		}
	});

	g_draw++;

}


//所有满足条件单的数据队列
let total_ware_list = [];

function matchWarehouse(current_priority, w_id) {
	if (current_priority['warehouse'] != '' && current_priority['warehouse']) {
		let warehouse_match = false;
		let warehouse_array = current_priority['warehouse'].split(",");
		for (let ware_index = 0; ware_index < warehouse_array.length; ware_index++) {
			let ware = warehouse_array[ware_index].trim();
			if (ware == w_id) {
				warehouse_match = true;
				break;
			}
		}
		if (!warehouse_match) {
			return true;
		}
	}
}

function matchMakeDate(current_priority, make_date) {
	if (current_priority['make_date'] != '' && current_priority['make_date']) {
		let make_date_match = false;
		let make_date_array = current_priority['make_date'].split(",");
		for (let make_index = 0; make_index < make_date_array.length; make_index++) {
			let make = make_date_array[make_index].trim();
			if (make == make_date) {
				make_date_match = true;
				break;
			}
		}
		if (!make_date_match) {
			return true;
		}
	}
}


//根据条件将仓单排好序号
function orderWarehouse(sheetList) {
	//刷新total_ware_list
	total_ware_list = [];
	let dataList = sheetList['result']['page']['list'];

	//总排序顺序
	let totalIndex = 1;
	//以条件单为维度进行遍历;不进行数量校验，符合条件就排序
	for (let m = 0; m <= g_memory_conditions.length; m++) {
		let conditionOrderNum = (m + 1);
		let currentCondition = g_memory_conditions[m];
		if (!currentCondition) {
			break;
		}
		let thisLunEff = [];

		//初始化list有效
		$.each(dataList, function(j, v) {
			v['invalid'] = false;
		});
		//遍历所有优先级
		infoLog('->第' + conditionOrderNum + "条件单扫描开始");

		for (let i = 1; i <= priority_limit_num; i++) {
			let thisPriLunEff = [];
			if (!currentCondition[i]) {
				break;
			}

			infoLog('->第' + conditionOrderNum + "条件单,第" + i + "优先级扫遍历开始");
			let current_priority = currentCondition[i];

			$.each(dataList, function(j, v) {
				if (v['invalid']) {
					return true;
				}
				//
				if (publicVariety.matchConditionByVariety(current_priority, v)) {
					return true;
				}
				//所有条件均通过则加入排序列表
				//深度复制，js会改变源数据
				let newValue = new Object();
				$.extend(true, newValue, v);
				newValue.condition_num = m; //记录本条目符合的条件
				newValue.priority_num = i; //记录本条目符合的优先级
				thisLunEff.push(newValue);
				thisPriLunEff.push(newValue);

				if (!v['satisQueue']) {
					v['satisQueue'] = [];
				}
				let item = {
					"condition_num": m,
					"priority_num": i
				};
				v['satisQueue'].push(item);
				//避免重复添加
				v['invalid'] = true;
			});

			infoLog("本条件单本优先级满足:" + JSON.stringify(thisPriLunEff));
		}
		total_ware_list.push(thisLunEff);
		infoLog("本条件单满足仓单条数，thisLunEff:" + thisLunEff.length);

	}
	//刷新源数据
	window.localStorage['warehouse_list'] = JSON.stringify(dataList);
	//记录到内存里，研究一下
	window.localStorage['total_ware_list'] = JSON.stringify(total_ware_list);

}


//记录成功以及失败记录
let successItemList = [];
let successReqIdList = [];
let failReqIdList = [];


function scan() {
	let start_time = new Date().getTime();
	let current_run = 0;
	//根据条件单数量初始化偏移量,条件单偏移完成标记
	let lastTimeSendListIndex = [];
	let finishFlag = [];
	for (let i = 0; i < g_memory_conditions.length; i++) {
		lastTimeSendListIndex[i] = 0;
		finishFlag[i] = false;
	}

	let stroredJson = getStroredJson();
	let variety = stroredJson['current_variety'];
	let commodity_id = stroredJson[variety]['commodity_id'];

	//遍历条件单，根据条件单分别组装本次请求
	let total_ware_list = JSON.parse(window.localStorage['total_ware_list']);
	//判断队列是否跑完/条件数是否达成
	let conditionQueueShift = [];

	while (true) {
		current_run++;
		let start_time_temp = new Date().getTime();
		//防止异常死循环，最多执行20次
		if (current_run >= 20) {
			infoLog("scan次数超过20次，强行退出")
			break;
		}

		let thisTimeReqList = [];

		//遍历条件单，组装本次请求队列


		for (let i = 0; i < g_memory_conditions.length; i++) {
			if (finishFlag[i]) {
				continue;
			}
			let conditionOrderNum = i + 1;
			let currentCondition = g_memory_conditions[i];
			let amount = currentCondition['amount'];
			if (!currentCondition || currentCondition['amount'] == '0') {
				continue;
			}
			let thisConditionList = total_ware_list[i];
			let thisTimeCount = 0;

			//TODO:调整为通过每笔数量进行汇总，每次发送仓单数不一定一致
			let thisTimeThisConditionList = new Array();
			for (let j = lastTimeSendListIndex[i]; j < thisConditionList.length; j++) {
				let balQty = thisConditionList[j]['balQty'];
				amount -= balQty;
				
				thisConditionList[j]['reqQty'] = amount < 0 ? balQty + amount : balQty;
				thisTimeThisConditionList.push(thisConditionList[j]);
				//偏移完毕
				if (j + 1 >= thisConditionList.length) {
					finishFlag[i] = true;
				}
				if (amount <= 0) {
					lastTimeSendListIndex[i] = j + 1;

					break;
				}
			}

			thisTimeReqList = thisTimeReqList.concat(thisTimeThisConditionList);
			infoLog("第" + conditionOrderNum + "条件单，第" + current_run + "轮将发送：" + thisTimeThisConditionList.length + "条数据");
		}

		infoLog("第" + current_run + "轮将发送：" + thisTimeReqList.length + "条数据");
		infoLog("第" + current_run + "轮将发送：" + JSON.stringify(thisTimeReqList));

		$('#process')[0].innerHTML += '->第' + current_run + "轮请求开始</br>";

		//循环当前轮次，直到全部成交或者无发送内容
		let sending_data = [];
		let going_number = 0;

		let reqIdList = [];
		$.each(thisTimeReqList, function(i, v) {
			let w_id = v['whId'];

			let cash = v['agio'];
			let reqQty = v['reqQty'];
			firm_id = v['firmId'];
			customer_id = v['customerId'];
			request_id = v['settleReqId'];
			//加入待提交列表
			g_reqid_priority_match.push({
				'request_id': request_id,
				'condition_num': v['condition_num']
			});
			reqIdList.push(request_id);
			var sending_item = {
				"settleReqId": request_id,
				"qty": reqQty,
				"sFirmId": firm_id,
				"sCustomerId": customer_id,
				"whId": w_id
			};
			sending_data.push(sending_item);
			going_number++;
		});

		infoLog("第" + current_run + "轮将发送reqIdList：" + JSON.stringify(reqIdList));
		let ret = {};
		if (sending_data.length == 0) {
			infoLog("第" + current_run + "轮没有可发送数据,跳过");
			continue;
		}

		//如果发送数据为空，则跳过
		//提交到成功为止，无内容不提交并模拟空返回
		//最多尝试5次
		let try_count = 0;
		while (true) {
			if (try_count > try_count_limit_times) {
				infoLog("重复请求超过" + try_count_limit_times + "次，强制退出");
				break;
			}
			try_count++;
			var repeatTimes = g_advance_start_scan_ms / g_advance_interval_scan_ms;
			if (try_count > repeatTimes) {
				break;
			}
			//第一轮次发送N次
			infoLog(current_run + "轮,第" + try_count + "次尝试");
			//第一轮提前发起，并重复N次
			var send_param = {
				"settlePicks": sending_data,
				"classId": publicVariety.g_variety_id,
				"commodityId": commodity_id
			};
			if (current_run == 1 && try_count <= repeatTimes) {
				doPick(send_param, current_run, try_count);
				sleep(g_advance_interval_scan_ms);
			} else {
				doPick(send_param, current_run, try_count);
				sleep(g_advance_interval_scan_ms);
				break;
			}
		}

		let end_time_temp = new Date().getTime();

		infoLog("第" + current_run + "轮执行时间：" + (end_time_temp - start_time_temp));

		//如果所有条件单list完成偏移，则结束
		let finalFlag = true;
		for (let i = 0; i < finishFlag.length; i++) {
			if (!finishFlag[i]) {
				finalFlag = finishFlag[i];
			}
		}
		if (finalFlag) {
			break;
		}

	}
	let end_time = new Date().getTime();
	//记录每条数据被谁请求
	window.localStorage['total_ware_list'] = JSON.stringify(total_ware_list);
	infoLog(getCurrentTime() + "整体请求执行时间：" + (end_time - start_time));
	detailBtnEnable = true;
}

function getCurrentTime() {
	let now = new Date();
	let time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds() + ";";

	return "当前时间-" + time;
}

function sleep(delay) {
	var start = (new Date()).getTime();
	while ((new Date()).getTime() - start < delay) {
		continue;
	}
}

//提交仓单请求
function doPick(sending_data, current_run, try_count) {
	let ret = null;
	let r = Math.random();
	$.ajax({
		"url": url_header + "doPick?r=" + r,
		"type": "POST",
		"dataType": 'json',
		"contentType": 'application/json',
		"data": JSON.stringify(sending_data),
		"async": true,

		"success": function(data) {

			if (data['code'] != 200) {
				infoLog("第" + current_run + "轮,第" + try_count + "次请求抢单失败:" + JSON.stringify(data));
				return;
			}

			ret = data['result'];

			//在这里进行成功值处理
			let fail_list = ret['failItems'];
			let succ_list = ret['successItems']
			infoLog("第" + current_run + "轮,第" + try_count + "次请求成功仓单，数量：" + succ_list.length + "数据：" + JSON.stringify(
				succ_list));
			infoLog("第" + current_run + "轮,第" + try_count + "次请求失败仓单：" + fail_list.length + "数据：" + JSON.stringify(fail_list));

			//把失败列表的仓单数量加回去
			$.each(fail_list, function(i, v) {
				req_id = v["settleReqId"];
				condition_num = getConditionNum(req_id);
				if ($.inArray(v['settleReqId'], failReqIdList) == -1) {
					failReqIdList.push(v['settleReqId'])
				}
			});

			$.each(succ_list, function(i, v) {
				if ($.inArray(v['settleReqId'], successReqIdList) == -1) {
					successReqIdList.push(v['settleReqId'])
					successItemList.push(v);
				}
			});

		},
		"error": function(data) {
			if (typeof(data.responseText) == "string") {
				ret = JSON.parse(data.responseText);
			} else {
				ret = data.responseText;
			}
		}
	});
	return ret;
}

//将本地储存的条件显示到前台,在页面加载完成和添加条件后被调用
function loadupCondition(variety) {
	$('#conditions')[0].innerHTML = '';

	let stroredJson = getStroredJson();

	//此处需要将内存中的条件信息重新从Local Storage读取
	g_memory_conditions = stroredJson[variety]['conditions'];
	total_ware_list = window.localStorage['total_ware_list'];

	$.each(g_memory_conditions, function(i, item) {
		let condition_panel = $('<div class ="single-condition"></div>');
		let amount_div_1 = $('<div class="amount-style">条件单: ' + (i + 1) + '</div>');
		let amount_div_2 = $('<div class="amount-style">数量: ' + item['amount'] + '</div>');
		
		let delPriorityImg = document.createElement("img");
		delPriorityImg.src = delImg;
		delPriorityImg.style="width: 20px;";
		let delDiv = document.createElement("div");
		delDiv.appendChild(delPriorityImg);
		delDiv.className = 'del-div-con delete_icon';
		delDiv.value = item["condition_num"];
		condition_panel.append(delDiv);
		let editPriorityImg = document.createElement("img");
		editPriorityImg.src = editImg;
		editPriorityImg.style="width: 20px;";
		let editDiv = document.createElement("div");
		editDiv.appendChild(editPriorityImg);
		editDiv.className = 'edit-div edit_condition_btn';
		editDiv.value = item["condition_num"];
		
		condition_panel.append(editDiv);
		condition_panel.append(amount_div_1);
		condition_panel.append(amount_div_2);
		let condition = $('<table class="condition-table" style="background-color: #f0f0f0;margin: 10px;"  id="condition' + item["condition_num"] + '">' +
			'</table>');
		condition_panel.append(condition);

		for (let q = 1; q <= 10; q++) {
			if (!item[q]) {
				break;
			}
			let conditionPriorItem = item[q];
			let match = publicVariety.loadupDisplayCondition(conditionPriorItem, q);
			condition.append(match);
			//condition[0].innerHTML += match;
		}
		$('#conditions').append(condition_panel);
	});
	$('.delete_icon').on('click', function() {
		if (!g_condition_addable) {
			tip('已停止删除条件');
			return;
		}
		if (editFlag) {
			tip('正在编辑条件');
			return;
		}
		if (!confirm('确认删除条件？')) {
			return;
		}

		let condition_num = $(this).attr('value');
		let stored_string = window.localStorage['fullauto_pick'];
		let old_json = JSON.parse(stored_string);
		let current_variety = old_json['current_variety'];

		let index;

		$.each(old_json[current_variety]['conditions'], function(i, v) {
			if (v['condition_num'] == condition_num) {
				index = i;
			}
		});

		old_json[current_variety]['conditions'].splice(index, 1);
		//同时在内存中删除该条件信息和该条件对应的剩余量
		g_memory_conditions = old_json[current_variety]['conditions'];
		window.localStorage['fullauto_pick'] = JSON.stringify(old_json);
		// $('#condition' + condition_num).remove();
		loadupCondition(current_variety)
	});

	$('.edit_condition_btn').on('click', function() {
		if (!g_condition_addable) {
			tip('已停止编辑条件');
			return;
		}
		showEditCondition($(this).attr('value'));
	});
}




let editPriorNum = 0;
function showEditCondition(condition_num) {
	editFlag = true;
	//如果存在旧的窗体，remove
	if (!!$('#condition-panel')) {
		$('#condition-panel').remove();
	}

	//关闭查看仓单界面
	detailDisplay = false;
	$("#pop-panel").remove();
	$("#getDetails").val("查看仓单");

	//条件编辑主窗体
	let condition_panel = document.createElement("div");
	condition_panel.style.zIndex = 99999;
	condition_panel.className = 'chrome-plugin-condition-panel';
	condition_panel.id = "condition-panel";

	//读取内存条件数据
	let stored_string = window.localStorage['fullauto_pick'];
	let old_json = JSON.parse(stored_string);
	let current_variety = old_json['current_variety'];
	//定位本条件对应序号
	let index;
	$.each(old_json[current_variety]['conditions'], function(i, v) {
		if (v['condition_num'] == condition_num) {
			index = i;
		}
	});
	let currCondition = g_memory_conditions[index];

	//条件单存储从0开始，展示从1开始
	let conditionOrderNum = index + 1;

	let header = document.createElement("div");
	header.className = "amount-style";
	header.style = "margin-bottom:5px;";
	header.innerText = "编辑条件单" + conditionOrderNum;
	condition_panel.appendChild(header);


	let addPriorityDiv = document.createElement("div");
	addPriorityDiv.className = "add-priory-div";
	let addPriority = document.createElement("button");
	let addPriorityImg = document.createElement("img");
	addPriorityImg.src = addImg;
	addPriorityImg.style="width: 20px;";
	addPriorityDiv.appendChild(addPriorityImg)
	addPriorityDiv.appendChild(addPriority);

	addPriority.className = "prior-button";
	addPriority.id = "addPriority";
	addPriority.innerText = "添加优先度";

	addPriorityDiv.onclick = function() {
		editPriorNum = addPriorityFun( main_condition);
	};

	condition_panel.appendChild(addPriorityDiv);
	//仓单需求数量模块
	let ware_amount = document.createElement("div");
	ware_amount.className = "ware-amount";
	ware_amount.id = "ware_amount";
	ware_amount.innerHTML = `仓单数量: <input id="amount" type="number" style='width:100px' value = '` + currCondition['amount'] + `'/><br/><br/>`;
	condition_panel.appendChild(ware_amount);	
	
	//展示优先级编辑模块
	let main_condition = document.createElement("div");
	main_condition.id = "main_condition";
	main_condition.className = "main_condition";
	
	
	//遍历条件list
	for (let i = 1;; i++) {
		if (!currCondition[i]) {
			break;
		}
		let priorInfo = currCondition[i];
		let panel = document.createElement('div');
		panel.id = "div" + i;
		panel.className = 'condition-line';
		panel.innerHTML = publicVariety.conditionPanelInnerHtml(priorInfo, i);
		editPriorNum = i;
		if(!currCondition[i+1]){
			let delPriorityImg = document.createElement("img");
			delPriorityImg.src = delImg;
			delPriorityImg.style="width: 20px;";
			let delDiv = document.createElement("div");
			delDiv.appendChild(delPriorityImg);
			delDiv.className = 'del-div';
			delDiv.onclick = function() {
				delPriorityFun();
			};
			panel.appendChild(delDiv);
		}
		main_condition.appendChild(panel);
	}
	condition_panel.appendChild(main_condition);

	let btn_div = document.createElement("div");
	btn_div.style = "margin-left: 40%;";
	
	let close_btn = document.createElement("input");
	close_btn.type = "button";
	close_btn.className = "click-button";
	close_btn.id = "close-btn";
	close_btn.value = "关闭";
	close_btn.onclick = function() {
		editFlag = false;
		$('#condition-panel').remove();
	}
	btn_div.appendChild(close_btn);
	
	let edit_btn = document.createElement("input");
	edit_btn.type = "button";
	edit_btn.className = "click-button";
	edit_btn.id = "edit-btn";
	edit_btn.value = "确认编辑";
	btn_div.appendChild(edit_btn);
	edit_btn.onclick = function() {
		editConditionSubmit(editPriorNum, index, currCondition, old_json);
	}

	condition_panel.appendChild(btn_div);

	document.body.append(condition_panel);
}

//确认编辑
function editConditionSubmit(editPriorNum, index, currCondition, old_json) {
	
	if (!g_condition_addable) {
		tip('已停止编辑条件');
		return;
	}
	//参数校验
	if (!$('#amount').val()) {

		tip("必须填写仓单数量");
		return;
	}

	let current_variety = old_json['current_variety'];

	let condition_num = currCondition['condition_num'];
	currCondition = publicVariety.editConditionByVariety(editPriorNum, condition_num);

	//同时在内存中删除该条件信息和该条件对应的剩余量
	old_json[current_variety]['conditions'][index] = currCondition;
	g_memory_conditions = old_json[current_variety]['conditions'];
	window.localStorage['fullauto_pick'] = JSON.stringify(old_json);
	// $('#condition' + condition_num).remove();
	editFlag = false;
	$('#condition-panel').remove();
	loadupCondition(current_variety);
}

//删除优先级
function delPriorityFun() {
	if (editPriorNum == 1) {
		tip("只剩最后一条了，无法删除");
		return
	}
	$("#div" + editPriorNum).remove();
	
	editPriorNum--;
	
	let delPriorityImg = document.createElement("img");
	delPriorityImg.src = delImg;
	delPriorityImg.style="width: 20px;";
	let delDiv = document.createElement("div");
	delDiv.appendChild(delPriorityImg);
	delDiv.className = 'del-div';
	delDiv.onclick = function() {
		delPriorityFun();
	};
	document.getElementById("div" + editPriorNum).appendChild(delDiv);
	return editPriorNum;
}

//新增优先级
function addPriorityFun(condition_panel) {
	if (editPriorNum >= 10) {
		tip("最多10个优先级");
		return
	}
	
	editPriorNum++;
	let div = document.getElementById("main_condition")
	let panel = document.createElement('div');
	panel.id = "div" + editPriorNum;
	panel.className = 'condition-line';
	panel.style.zIndex = 99999;
	panel.innerHTML = publicVariety.addConditionPanelHtml(editPriorNum);
	
	condition_panel.appendChild(panel);
	
	$(".del-div").remove();
	
	let delPriorityImg = document.createElement("img");
	delPriorityImg.src = delImg;
	delPriorityImg.style="width: 20px;";
	let delDiv = document.createElement("div");
	delDiv.appendChild(delPriorityImg);
	delDiv.className = 'del-div';
	delDiv.onclick = function() {
		editPriorNum = delPriorityFun();
	};
	panel.appendChild(delDiv);
	return editPriorNum;
}

//初始化倒计时，获取当前时间 提前10秒执行ready方法（获取仓单列表），0秒时开始扫描
var ready_timeout;
var timeout;
var count_interval;

function getTime() {
	clearTimeout();
	clearInterval();
	let countdown = 0;
	$.ajax({
		"url": get_time_url,
		"type": "GET",
		"async": false,
		"success": function(data) {

			countdown = getStroredJson()[publicVariety.g_variety_id]['start_time'] - parseInt(data['result'], 10);

			//启动时在倒计时g_advance_get_sheet_list_ms 毫秒内则立即获取仓单列表,放入内存
			if (countdown - g_advance_get_sheet_list_ms <= 0) {
				ready();
			} else {
				//在5s倒计时时获取仓单列表放入内存
				ready_timeout = setTimeout(function() {
					ready();
				}, countdown - g_advance_get_sheet_list_ms); //提前g_advance_get_sheet_list_ms 毫秒获取仓单列表

			}

			//倒计时0s时开始对仓单列表进行扫码
			timeout = setTimeout(function() {
				$('#process')[0].innerHTML += '->开始</br>';
				var start_ms = new Date().getTime();

				scan();
				$('#count_down').html('启动');
				var end_ms = new Date().getTime();
				$('#process')[0].innerHTML += '->结束 耗时:' + (end_ms - start_ms) + '毫秒';
				infoLog('仓单条件对应关系：' + JSON.stringify(g_reqid_priority_match));
				displayResult = true;
			}, countdown - g_advance_start_scan_ms);

			//倒计时次数
			let tick_num = 1;
			//倒计时间隔毫秒数
			let tick_interval_ms = 1000;
			//1秒为间隔进行倒计时
			count_interval = setInterval(function() {
				let remain_sec = (countdown - tick_interval_ms * tick_num) / 1000;
				if (remain_sec <= 0) {
					$('#count_down').html('启动');
					clearInterval();
					return;
				}
				$('#count_down').html(remain_sec + '秒');
				tick_num++;

			}, tick_interval_ms)
			infoLog('定时器初始化.');
		}
	});
}

let detailDisplay = false;

function closeDetail(){
	detailDisplay = false;
	$("#pop-panel").remove();
	return;
}

//获取仓单情况
function getDetails() {
	if (!detailBtnEnable) {
		detailDisplay = false;
		$("#pop-panel").remove();
		//$("#getDetails").val("查看仓单");
		tip("正在抢单，请稍后查看")
		return;
	}
	if(detailDisplay == true){
		return;
	}
	
	$("#condition-panel").remove()
	detailDisplay= true;
// 	if (!detailDisplay) {
// 		detailDisplay = true;
// 		$("#getDetails").val("关闭");
// 
// 	} else {
// 		detailDisplay = false;
// 		$("#pop-panel").remove();
// 		$("#getDetails").val("查看仓单");
// 		return;
// 	}

	//如果已经禁止添加，则直接展示，不更新列表
	if (g_condition_addable) {
		let stroredJson = getStroredJson();

		let variety = stroredJson['current_variety'];
		let commodity_id = stroredJson[variety]['commodity_id'];
		let round_number = stroredJson[variety]['round_number'];
		let param = publicVariety.getParam(variety, commodity_id, round_number);
		let r = Math.random();
		$.ajax({
			"url": url_header + "getSheetList?r=" + r,
			"type": "POST",
			"dataType": 'json',
			"contentType": 'application/json',
			"data": JSON.stringify(param),
			"async": false,
			"success": function(data) {

				orderWarehouse(data)
			}
		});
	}
	displayPrior();
}


//展示满足条件的仓单列表
function displayPrior() {
	
	let windowHeight = window.innerHeight;
	let distinctReq = [];
	let distinctTotalNum = 0;
	let totalData = JSON.parse(window.localStorage['total_ware_list']);
	let panel = document.createElement('div');
	panel.style.zIndex = 99997;
	panel.className = 'chrome-plugin-pop-panel';
	panel.id = "pop-panel";
	let countTotal = document.createElement('div');
	countTotal.className = "count-total";
	panel.style.height = windowHeight * 0.9 + "px";
	let stroredJson = getStroredJson();
	let variety = stroredJson['current_variety'];
	g_memory_conditions = stroredJson[variety]['conditions'];
	if (displayResult) {
		let table = document.createElement('table');
		table.innerHTML =
			`
		<tr class ="tr-header">
		<td class = "cus-td">条件单</td>
		<td class = "cus-td">需求量</td>
		<td class = "cus-td">满足条件量</td>
		<td class = "cus-td">成功量</td>
    </tr>
        `;
		//分别遍历条件单list
		$.each(totalData, function(index, singleList) {
			let conditionNum = index + 1;
			let successNum = 0;
			let totalNum = 0;
			let amount = g_memory_conditions[index]['amount'];


			$.each(singleList, function(i, item) {
				totalNum += item['balQty'];
				if ($.inArray(item['settleReqId'], successReqIdList) != -1) {

					$.each(successItemList, function(i, v) {
						if (v['settleReqId'] == item['settleReqId']) {
							successNum += v['realQty'];
						}
					});
				}
			});
			let tr = document.createElement('tr');
			tr.innerHTML = `
		<td class = "cus-td">` + conditionNum + `</td>
		<td class = "cus-td">` + amount +
				`</td>
        <td class = "cus-td">` + totalNum + `</td>
		<td class = "cus-td">` + successNum +
				`</td>`;
			if (index % 2 == 0) {
				tr.className = "tr-even";
			} else {
				tr.className = "tr-odd";
			}
			table.appendChild(tr);
		});
		let title = document.createElement('caption');
		title.className = "cus-title"
		title.innerHTML = `请求结果`;
		table.prepend(title)
		panel.appendChild(table);
		let spaceDiv = document.createElement('div');
		spaceDiv.innerHTML = "</br></br>";
		panel.append(spaceDiv);
	}

	//分别遍历条件单list
	$.each(totalData, function(index, singleList) {
		let displayDiv = document.createElement('table');
		//每个仓单不止一笔
		let thisConditionTotalNum = 0;
		for (let i = 0; i < singleList.length; i++) {
			thisConditionTotalNum += singleList[i]['balQty'];
		}
		var satisCountItem = document.createElement('div');
		satisCountItem.className="count-stas-item";
		satisCountItem.innerHTML = "满足条件单" + (index + 1) + "共有：" + thisConditionTotalNum + "个仓单;"
		
		countTotal.appendChild(satisCountItem);

		panel.appendChild(displayDiv)
		let table = document.createElement('table');
		table.className = "condition-table";

		table.innerHTML = publicVariety.displayWarehouseTable();
		let title = document.createElement('caption');
		title.className = "cus-title"
		title.innerHTML = `
            条件单` + (index + 1);
		table.prepend(title)
		let dataList = JSON.parse(window.localStorage['warehouse_list']);


		$.each(singleList, function(id, item) {
			if (distinctReq.indexOf(item['settleReqId']) < 0) {
				distinctReq.push(item['settleReqId']);
				distinctTotalNum += item['balQty'];
			}
			let tr = document.createElement('tr');
			let result = '尚未抢单';
			let success_num = 0;
			let repeatFlag = false;
			$.each(dataList, function(index, totalItem) {
				if (item['settleReqId'] == totalItem['settleReqId']) {
					if (!!totalItem['satisQueue'] && totalItem['satisQueue'].length > 1) {
						repeatFlag = true;
					}
				}
			})

			//抢单情况判断
			if ($.inArray(item['settleReqId'], successReqIdList) != -1) {
				result = '成功';
				$.each(successItemList, function(i, v) {
					if (v['settleReqId'] == item['settleReqId']) {
						success_num = v['realQty'];
						result += success_num;
					}
				});
			} else if ($.inArray(item['settleReqId'], failReqIdList) != -1) {
				result = '失败'
			}

			if (id % 2 == 0) {
				tr.className = "tr-even";
			} else {
				tr.className = "tr-odd";
			}
			if (repeatFlag) {
				tr.className = "tr-repeat";
			}


			tr.innerHTML = publicVariety.displayWareHouseValue(item, id, result)
			table.appendChild(tr)
		});
		panel.appendChild(table);
		// let spaceDiv = document.createElement('div');
		// spaceDiv.innerHTML = "</br></br>";
		// panel.append(spaceDiv);
	});
	//加上总计
	var satisTotalCountItem = document.createElement('div');
	satisTotalCountItem.innerHTML += "去重后所有满足条件的仓单合计" + distinctTotalNum + "个仓单";
		satisTotalCountItem.className="count-stas-item";
	countTotal.appendChild(satisTotalCountItem);
	panel.prepend(countTotal);
	document.body.appendChild(panel)
}

//初始化前端展示，获取当前CF round_num，触发倒计时,同时初始化Local Storage
function initCustomPanel() {
	let panel = document.createElement('div');
	panel.style.zIndex = 99998;
	panel.className = 'chrome-plugin-demo-panel';
	panel.innerHTML =
		`
		<div>
		<div class = "condition-header">
		    <div class = "condition-header-variety">品种：<label id="variety"></label>
		    </div>
		    <div class = "condition-header-time">
		    <div class = "condition-header-single">
		    场次:<label id='round_numebr'></label>
		    </div>
		    <div class = "condition-header-single">倒计时:<label id='count_down' style='color: red;'></label></p>
		    </div>
			</div>
		</div>
		<div class="condition-detail">
		<div id='process'></div>
		<div id='conditions'></div>
		</div>
		<div class="condition-panel-btn" style="text-align: center;margin-left: 25%;">
            <input class= "condition-button" id="getDetails" type="button" value="查看仓单"/>
            <input class= "condition-button" id="closeDetail" type="button" value="关闭仓单"/>
		</div>
	`;
	document.body.append(panel);
	$("#getDetails").on('click', function() {
		getDetails();
	})
	$("#closeDetail").on('click', function() {
		closeDetail();
	})
	let r = Math.random();
	$.ajax({
		"url": url_header + "getRoundList?r=" + r,
		"type": "POST",
		"async": false,
		"success": function(data) {
			if (typeof(data) == "string") {
				data = JSON.parse(data);
			}
			$.each(data['result']['roundList'], function(i, v) {
				if (v['classId'] == publicVariety.g_variety_id) {

					$('#variety').html(v['className']);
					$('#round_numebr').html(v['roundNo']);

					if (!(getStroredJson() && getStroredJson()[publicVariety.g_variety_id] && getStroredJson()[publicVariety.g_variety_id]
							['round_number'] &&
							v['roundNo'] == getStroredJson()[publicVariety.g_variety_id]['round_number'])) {
						let varitety_conditions = new Object();
						varitety_conditions[publicVariety.g_variety_id] = {
							'conditions': []
						};
						window.localStorage['fullauto_pick'] = JSON.stringify(varitety_conditions);
						//清除上一轮的记录
						window.localStorage['total_ware_list'] = "";
						window.localStorage['warehouse_list'] = "";
					}
					saveLocalStorage({
						'current_variety': publicVariety.g_variety_id
					});
					loadupCondition(getStroredJson()['current_variety']);
					var pickStartTime = v['pickStartTime'];
					pickStartTime = pickStartTime.replace(new RegExp("-", "gm"), "/");
					var startDateM = (new Date(pickStartTime)).getTime(); //得到毫秒数
					let varitety_conditions = new Object();
					varitety_conditions[publicVariety.g_variety_id] = {
						'start_time': startDateM,
						'round_number': v['roundNo'],
						'commodity_id': v['commodityId']
					};
					saveLocalStorage(varitety_conditions);

				}
			});
		}
	});

	getTime();

}

function infoLog(msg) {
	console.log(getCurrentTime() + msg);
}

// 接收来自后台的消息，用于接受来自popup的条件，放入本地并触发前端刷新
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	infoLog('收到来自 ' + (sender.tab ? "content-script(" + sender.tab.url + ")" : "popup或者background") + ' 的消息：',
		request);
	if (request["action"] == "sendRequest") {
		$.ajax({
			"url": request["url"],
			"type": "POST",
			"async": false,
			"success": function(data) {
				sendResponse(data);
			}

		})
	} else if (request["action"] == "addIntoConditions") {

		if (!g_condition_addable) {
			tip('已停止增加条件')
			return;
		}

		var stroredJson = getStroredJson();

		var variety = stroredJson['current_variety'];
		var conditions = stroredJson[variety]['conditions'];
		if (!conditions) {
			conditions = [];
		}
		var condition = JSON.parse(request['condition']);

		conditions.push(condition);
		let varitety_conditions = new Object();
		varitety_conditions[publicVariety.g_variety_id] = {
			'conditions': conditions,
		};
		saveLocalStorage(varitety_conditions);
		loadupCondition(variety);
		tip('添加成功')
	}
	/*	if(request.cmd == 'update_font_size') {
	        var ele = document.createElement('style');
	        ele.innerHTML = `* {font-size: ${request.size}px !important;}`;
	        document.head.appendChild(ele);
	    } else if(request.cmd == 'invoke') {
	         eval(request.method);
	    }
	    else {
	        tip(JSON.stringify(request));
	        sendResponse('我收到你的消息了：'+JSON.stringify(request));
	    }*/


});

// 主动发送消息给后台
// 要演示此功能，请打开控制台主动执行sendMessageToBackground()
function sendMessageToBackground(message) {
	chrome.runtime.sendMessage(message, function(response) {

	});
}

// 监听长连接
chrome.runtime.onConnect.addListener(function(port) {
	infoLog(port);
	if (port.name == 'test-connect') {
		port.onMessage.addListener(function(msg) {
			infoLog('收到长连接消息：', msg);
			tip('收到长连接消息：' + JSON.stringify(msg));
			if (msg.question == '你是谁啊？') port.postMessage({
				answer: '我是你爸！'
			});
		});
	}
});

var tipCount = 0;
// 简单的消息通知
function tip(info) {
	info = info || '';
	var ele = document.createElement('div');
	ele.className = 'chrome-plugin-simple-tip slideInLeft';
	ele.style.top = tipCount * 70 + 100 + 'px';
	ele.innerHTML = `<div>${info}</div>`;
	document.body.appendChild(ele);
	ele.classList.add('animated');
	tipCount++;
	setTimeout(() => {
		ele.style.top = '-100px';
		setTimeout(() => {
			ele.remove();
			tipCount--;
		}, 400);
	}, 3000);
}
/*window.addEventListener("message", function(e)
{
	infoLog('收到消息：', e.data);
	if(e.data && e.data.cmd == 'invoke') {
		eval('('+e.data.code+')');
	}
	else if(e.data && e.data.cmd == 'message') {
		tip(e.data.data);
	}
}, false);*/


/*function initCustomEventListen() {
	var hiddenDiv = document.getElementById('myCustomEventDiv');
	if(!hiddenDiv) {
		hiddenDiv = document.createElement('div');
		hiddenDiv.style.display = 'none';
		hiddenDiv.id = 'myCustomEventDiv';
		document.body.appendChild(hiddenDiv);
	}
	hiddenDiv.addEventListener('myCustomEvent', function() {
		var eventData = document.getElementById('myCustomEventDiv').innerText;
		tip('收到自定义事件：' + eventData);
	});
}*/
