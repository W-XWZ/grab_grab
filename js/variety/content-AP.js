/**
 * 根据品种匹配条件与仓单的关系
 * @param {Object} current_priority 当前条件
 * @param {Object} sheetItem 当前仓单
 */
function matchConditionByVariety(current_priority, sheetItem){
	
	let balQty = sheetItem['balQty'];
	//防止异常情况
	if(!balQty){
		balQty = 1;
	}

	//仓单编号
	let spcId = sheetItem['spcId'] == null ? "" : sheetItem['spcId'] ;
	let placeName = sheetItem['placeName'] == null ? "" : sheetItem['placeName'];
	let w_id = sheetItem['whId'] == null ? "" : sheetItem['whId'] ;
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
	//支持多仓库 多个仓库用逗号进行分割
	if(matchWarehouse(current_priority, w_id)){
		return true;
	}
	if (current_priority['district'] != '' && (null == placeName ||(placeName !=null && placeName.indexOf(current_priority['district']) < 0))) {
		return true;
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
		let warehouse = conditionPriorItem["warehouse"];
		let district = conditionPriorItem["district"];
		match += "产地: " + district + "仓库: " + warehouse;
		return match;
}

/**
 * 展示条件编辑窗体
 * @param {Object} conditionPriorItem
 * @param {Object} index
 */
function conditionPanelInnerHtml(conditionPriorItem, index){
	let innerHTML = `优先度` + index + `:
			<input class = "condition-input" id="spcId_` +
				index + `" placeholder="仓单编号" type="text" style='width:100px' value = "` + conditionPriorItem['spcId'] +
				`"/> 
				<input class = "condition-input" id="district_` + index +
			`" placeholder="产地" type="text" style='width:100px' value = "` + conditionPriorItem['district'] +
			`"/> 
				<input class = "condition-input" id="warehouse_` +
					index + `" placeholder="仓库" type="text" style='width:100px' value = "` + conditionPriorItem['warehouse'] +
					`"/> 
			</br>
					`;
	return innerHTML;
}

/**
 * 编辑增加一个优先级
 * @param {Object} editPriorNum
 */
function addConditionPanelHtml(editPriorNum){
	let innerHTML = `
				优先度` + editPriorNum + `:
			<input class = "condition-input" id="spcId_` +
				editPriorNum + `" placeholder="仓单编号" type="text" style='width:100px' /> 
			<input class = "condition-input" id="district_` + editPriorNum +
			`" placeholder="产地" type="text" style='width:100px'/> 
			<input class = "condition-input" id="warehouse_` +
			editPriorNum +
			`" placeholder="仓库" type="text" style='width:100px'/>
		</br>
		`;
	return innerHTML;
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
/**
 * 验证仓库输入格式
 * @param obj
 * @returns {boolean}
 */
function validateWarehouse(obj){
	let pattern = /^[0-9,]*$/;
	let reg = new RegExp(pattern);
	if("" == obj){
		return true;
	}
	if(!reg.test(obj)){
		return  false;
	}
	return true
}

function validateCondition(editPriorNum){
	for (let i = 1; i <= editPriorNum; i++) {
	
		let spcId = $('#spcId_' + i).val();
		if(validateSpcId(spcId) == false){
			alert("参数错误， spcId：" + spcId);
			return;
		}
	    let warehouse = $('#warehouse_' + i).val();
	    if(validateWarehouse(warehouse) == false){
	        alert("参数错误， warehouse：" + warehouse);
	        return;
	    }
	}
}
function editConditionByVariety( editPriorNum, condition_num){
	validateCondition(editPriorNum);

	let currCondition = {};
	currCondition['amount'] = $('#amount').val()
	currCondition['condition_num'] = condition_num;
	for (let i = 1; i <= editPriorNum; i++) {
		
			let spcId = $('#spcId_' + i).val();
		let district = $('#district_' + i).val();
		let warehouse = $('#warehouse_' + i).val();
		currCondition[i] = {
			"spcId": spcId,
			"district": district,
			"warehouse": warehouse,
			"condition_num": condition_num
		}
	}
	return currCondition;
}

//保存输入的条件
function makeConditionStore(i, condition){
		let spcId = $('#spcId_' + i).val();
	let warehouse = $('#warehouse_' + i).val();
	let district = $('#district_' + i).val();
	
	condition[i] = {
			"spcId": spcId,
		"district": district,
		"warehouse": warehouse,
		"condition_num": window.localStorage['condition_num']
	}
}

/**
 * 获取品种请求参数,formDefine写死
 * @param {Object} variety
 * @param {Object} commodity_id
 * @param {Object} round_number
 */
function getParam(variety, commodity_id, round_number){
	let param = {};
	param.classId = variety;
	param.commodityId = commodity_id;
	param.pageIndex = 1;
	param.pageSize = 10000;
	param.settleType = "";
	param.roundId=round_number;

	param.formDefine=JSON.parse("{\"formDefineId\": 10032,\"formId\": \"selection_query_condition\",\"formAttrDefines\": [{\"attrId\": 1673,\"formAttrDefineId\": 3035,\"name\": \"VALUATION_POINT\",\"bizName\": \"valuationPoint\",\"value\": null}, {\"attrId\": 2,\"formAttrDefineId\": 3036,\"name\": \"PLACE_NAME\",\"bizName\": \"placeName\",\"value\": null}, {\"attrId\": 1657,\"formAttrDefineId\": 3037,\"name\": \"ITEM_ID\",\"bizName\": \"itemId\",\"value\": null}]}");
	return param;
}


/**
 * 根据选中品种展示条件列表
 * @param {Object} tempNum
 */
// function displayConditionList(tempNum){
// 	let innerHTML = `
// 				优先度` + tempNum + `:
// 				<input class = "condition-input" id="district_` + tempNum +
// 				`" placeholder="产地" type="text" style='width:100px'/> 
// 			<input class = "condition-input" id="warehouse_` +
// 			tempNum +
// 			`" placeholder="仓库" type="text" style='width:100px'/> 
// 			</br>
// 		`;
// 	return innerHTML;
// }

/**
 * 展示仓单列表抬头
 */
function displayWarehouseTable(){
	let innerHTML =
		`
	<tr class ="tr-header">
	<td class = "cus-td" >序号</td>
	<td class = "cus-td" style="width: 140px;">仓单编号</td>
	<td class = "cus-td">请求编号</td>
	<td class = "cus-td">产地</td>
	<td class = "cus-td">仓库</td>
	<td class = "cus-td">计价点</td>
	<td class = "cus-td">数量</td>
	<td class = "cus-td">满足优先级</td>
	<td class = "cus-td">抢单情况</td>
</tr>
	`;
		return innerHTML;
}

function displayWareHouseValue(item, id, result){
		let cash = null == item['agio'] ? '-': item['agio']
	let placeName = null == item['placeName'] ? '-' : item['placeName'];
	let valuationPoint = null == item['valuationPoint'] ? '-' : item['valuationPoint'];
	let levId = null == item['levId'] ? '-' : item['levId'];
	let whId = null == item['whId'] ? '-' : item['whId'];
	let spcId = null == item['spcId'] ? '-' : item['spcId'];
	let innerHTML =  `
			<td class = "cus-td">` + (id + 1 ) + `</td>
			<td class = "cus-td">` + spcId + `</td>
			<td class = "cus-td">` + item['settleReqId'] + `</td>
			<td class = "cus-td">` + placeName + `</td>
			<td class = "cus-td">` + whId + `</td>
			<td class = "cus-td">` + valuationPoint + `</td>
			<td class = "cus-td">` + item['balQty'] + `</td>
			<td class = "cus-td">` + item['priority_num'] + `</td>
			<td class = "cus-td">` + result + `</td>`;
	return innerHTML;
}
export  {matchConditionByVariety,loadupDisplayCondition, conditionPanelInnerHtml, addConditionPanelHtml,getParam, makeConditionStore, displayWarehouseTable,displayWareHouseValue,editConditionByVariety,validateCondition}