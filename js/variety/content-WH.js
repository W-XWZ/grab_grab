function matchConditionByVariety(current_priority, sheetItem){
	
	let balQty = sheetItem['balQty'];
	//防止异常情况
	if(!balQty){
		balQty = 1;
	}

	let spcId = sheetItem['spcId'] == null ? "" : sheetItem['spcId'] ;
	
	if (current_priority['spcId'] != '' && !!current_priority['spcId']) {
		let spcId_match = false;
		let spcId_match_array = current_priority['spcId'].split(",");
		for (let spcId_match_index = 0; spcId_match_index < spcId_match_array.length; spcId_match_index++) {
			let spcId_compare = spcId_match_array[spcId_match_index].trim();
			if (spcId == spcId_compare) {
				spcId_match = true;
				break;
			}
		}
		if (!spcId_match) {
			return true;
		}
	}
}

/**
 * 右下角读取展示条件
 * @param {Object} conditionPriorItem
 * @param {Object} index
 */
function loadupDisplayCondition(conditionPriorItem, index) {
		let match = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;优先度" + index;
		
		let spcId = conditionPriorItem["spcId"];
		match += "仓单编号: " + spcId ;
		return match;
}


function validateCondition(editPriorNum){
	for (let i = 1; i <= editPriorNum; i++) {
	
	    let spcId = $('#spcId_' + i).val();
	    if(validateSpcId(spcId) == false){
	        alert("参数错误， spcId：" + spcId);
	        return;
	    }
	}
}

function validateSpcId(obj){
	let pattern = /^[A-Za-z0-9,]*$/;
	let reg = new RegExp(pattern);
	if("" == obj){
		return true;
	}
	if(!reg.test(obj)){
		return  false;
	}
	return true
}

function editConditionByVariety(editPriorNum,condition_num){
	validateCondition(editPriorNum);
	
	let currCondition = {};
	currCondition['amount'] = $('#amount').val()
	currCondition['condition_num'] = condition_num;
	for (let i = 1; i <= editPriorNum; i++) {
		
		let spcId = $('#spcId_' + i).val();
		currCondition[i] = {
			"spcId": spcId,
			"condition_num": condition_num
		}
	}
	return currCondition;
}

/**
 * 展示条件编辑窗体
 * @param {Object} conditionPriorItem
 * @param {Object} index
 */
function conditionPanelInnerHtml(conditionPriorItem, index){
	let innerHTML = `优先度` + index + `:
			<input class = "condition-input" id="spcId_` +
				index + `" placeholder="仓单编号" type="text" style='width:500px' value = "` + conditionPriorItem['spcId'] +
				`"/> 
			 </br>
				`;
	return innerHTML;
}

function addConditionPanelHtml(editPriorNum){
	let innerHTML = `
				优先度` + editPriorNum + `:
			<input class = "condition-input" id="spcId_` +
			editPriorNum +
			`" placeholder="仓单编号" type="text" style='width:500px'/> 
		</br>
		`;
	return innerHTML;
}

function getParam(variety, commodity_id, round_number){
	let param = {};
	param.classId = variety;
	param.commodityId = commodity_id;
	param.pageIndex = 1;
	param.pageSize = 10000;
	param.settleType = "";
	param.roundId=round_number;

	param.formDefine=JSON.parse("{\"formDefineId\":10032,\"formId\":\"selection_query_condition\",\"formAttrDefines\":[{\"attrId\":2420,\"formAttrDefineId\":3081,\"name\":\"WH_ID\",\"bizName\":\"whId\",\"value\":null},{\"attrId\":2416,\"formAttrDefineId\":3082,\"name\":\"MAKE_DATE\",\"bizName\":\"makeDate\",\"value\":null},{\"attrId\":34,\"formAttrDefineId\":3083,\"name\":\"PLACE_NAME\",\"bizName\":\"placeName\",\"value\":null},{\"attrId\":2419,\"formAttrDefineId\":3084,\"name\":\"LEV_ID\",\"bizName\":\"levId\",\"value\":null}]}");
	return param;
}


//保存输入的条件
function makeConditionStore(i, condition){
	let spcId = $('#spcId_' + i).val();
	
	condition[i] = {
		"spcId": spcId,
		"condition_num": window.localStorage['condition_num']
	}
}
	

function displayWarehouseTable(){
	let innerHTML =
		
	`<tr class ="tr-header">
		<td class = "cus-td" >序号</td>
		<td class = "cus-td" style="width: 140px;">仓单编号</td>
		<td class = "cus-td">请求编号</td>
		<td class = "cus-td">仓库</td>
		<td class = "cus-td">年度</td>
		<td class = "cus-td">等级</td>
		<td class = "cus-td">类别</td>
		<td class = "cus-td">产地</td>
		<td class = "cus-td">数量</td>
		<td class = "cus-td">满足优先级</td>
		<td class = "cus-td">抢单情况</td>
	</tr>`;
	return innerHTML;
}
	
function displayWareHouseValue(item, id, result){
	let cash = null == item['agio'] ? '-': item['agio']
	let placeName = null == item['placeName'] ? '-' : item['placeName'];
	let makeDate = null == item['makeDate'] ? '-' : item['makeDate'];
	// 等级
	let levId = null == item['levId'] ? '-' : item['levId'];
	// 类别
	let itemId = null == item['itemId'] ? '-' : item['itemId'];
	let whId = null == item['whId'] ? '-' : item['whId'];
	let spcId = null == item['spcId'] ? '-' : item['spcId'];
	let innerHTML =  `
			<td class = "cus-td">` + (id + 1 ) + `</td>
			<td class = "cus-td">` + spcId + `</td>
			<td class = "cus-td">` + item['settleReqId'] + `</td>
			<td class = "cus-td">` + whId + `</td>
			<td class = "cus-td">` + makeDate + `</td>
			<td class = "cus-td">` + levId + `</td>
			<td class = "cus-td">` + itemId + `</td>
			<td class = "cus-td">` + placeName + `</td>
			<td class = "cus-td">` + item['balQty'] + `</td>
			<td class = "cus-td">` + item['priority_num'] + `</td>
			<td class = "cus-td">` + result + `</td>`;
	return innerHTML;
}

export  {matchConditionByVariety,loadupDisplayCondition, conditionPanelInnerHtml, addConditionPanelHtml,getParam, makeConditionStore, displayWarehouseTable,displayWareHouseValue, editConditionByVariety,validateCondition}