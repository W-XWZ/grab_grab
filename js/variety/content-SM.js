function matchConditionByVariety(current_priority, sheetItem){
	
	let balQty = sheetItem['balQty'];
	//防止异常情况
	if(!balQty){
		balQty = 1;
	}

	let spcId = sheetItem['spcId'] == null ? "" : sheetItem['spcId'] ;
	let w_id = sheetItem['whId'] == null ? "" : sheetItem['whId'] ;

	//支持多仓库 多个仓库用逗号进行分割
	if(matchWarehouse(current_priority, w_id)){
		return true;
	}
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
		let warehouse = conditionPriorItem["warehouse"];
		match += "仓库: " + warehouse;
		return match;
}

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
	
	    let warehouse = $('#warehouse_' + i).val();
	    if(validateWarehouse(warehouse) == false){
	        alert("参数错误， warehouse：" + warehouse);
	        return;
	    }
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
		let warehouse = $('#warehouse_' + i).val();
		currCondition[i] = {
			"warehouse": warehouse,
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
				index + `" placeholder="仓单编号" type="text" style='width:200px' value = "` + conditionPriorItem['spcId'] +
					`"/> 
				<input class = "condition-input" id="warehouse_` +
					index + `" placeholder="仓库" type="text" style='width:100px' value = "` + conditionPriorItem['warehouse'] +
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
			`" placeholder="仓单编号" type="text" style='width:200px'/> 
			<input class = "condition-input" id="warehouse_` +
			editPriorNum +
			`" placeholder="仓库" type="text" style='width:100px'/> 
			
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

	param.formDefine=JSON.parse("{\"formDefineId\":10032,\"formId\":\"selection_query_condition\",\"formAttrDefines\":[{\"attrId\":2319,\"formAttrDefineId\":3052,\"name\":\"WH_ID\",\"bizName\":\"whId\",\"value\":null},{\"attrId\":2320,\"formAttrDefineId\":3053,\"name\":\"MAKE_DATE\",\"bizName\":\"makeDate\",\"value\":null},{\"attrId\":28,\"formAttrDefineId\":3054,\"name\":\"PLACE_NAME\",\"bizName\":\"placeName\",\"value\":null},{\"attrId\":2316,\"formAttrDefineId\":3055,\"name\":\"LEV_ID\",\"bizName\":\"levId\",\"value\":null}]}");
	return param;
}


//保存输入的条件
	function makeConditionStore(i, condition){
		let warehouse = $('#warehouse_' + i).val();
		
		let spcId = $('#spcId_' + i).val();
		condition[i] = {
			//"district": district,
			"warehouse": warehouse,
			"spcId": spcId,
			"condition_num": window.localStorage['condition_num']
		}
	}
	
	//根据选中品种展示条件列表
	// function displayConditionList(tempNum){
	// 	let innerHTML = `
	// 				优先度` + tempNum + `:
	// 			<input class = "condition-input" id="spcId_` +
	// 			tempNum +
	// 			`" placeholder="仓单编号" type="text" style='width:200px'/> 
	// 			<input class = "condition-input" id="warehouse_` +
	// 			tempNum +
	// 			`" placeholder="仓库" type="text" style='width:100px'/> 
	// 			</br>
	// 		`;
	// 	return innerHTML;
	// }
	function displayWarehouseTable(){
			let innerHTML =
				`
			<tr class ="tr-header">
			<td class = "cus-td" >序号</td>
			<td class = "cus-td" style="width: 140px;">仓单编号</td>
			<td class = "cus-td">请求编号</td>
			<td class = "cus-td">产地</td>
			<td class = "cus-td">仓库</td>
			<td class = "cus-td">年份</td>
			<td class = "cus-td">数量</td>
			<td class = "cus-td">等级</td>
			<td class = "cus-td">满足优先级</td>
			<td class = "cus-td">抢单情况</td>
		</tr>
			`;
				return innerHTML;
		}
	function displayWareHouseValue(item, id, result){
			let cash = null == item['agio'] ? '-': item['agio']
		let placeName = null == item['placeName'] ? '-' : item['placeName'];
		let makeDate = null == item['makeDate'] ? '-' : item['makeDate'];
		let levId = null == item['levId'] ? '-' : item['levId'];
		let whId = null == item['whId'] ? '-' : item['whId'];
		let spcId = null == item['spcId'] ? '-' : item['spcId'];
		let innerHTML =  `
				<td class = "cus-td">` + (id + 1 ) + `</td>
				<td class = "cus-td">` + spcId + `</td>
				<td class = "cus-td">` + item['settleReqId'] + `</td>
				<td class = "cus-td">` + placeName + `</td>
				<td class = "cus-td">` + whId + `</td>
				<td class = "cus-td">` + makeDate + `</td>
				<td class = "cus-td">` + item['balQty'] + `</td>
				<td class = "cus-td">` + levId + `</td>
				<td class = "cus-td">` + item['priority_num'] + `</td>
				<td class = "cus-td">` + result + `</td>`;
		return innerHTML;
	}
export  {matchConditionByVariety,loadupDisplayCondition, conditionPanelInnerHtml, addConditionPanelHtml,getParam, makeConditionStore, displayWarehouseTable,displayWareHouseValue, editConditionByVariety,validateCondition}