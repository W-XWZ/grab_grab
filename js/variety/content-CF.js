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
	let cash = sheetItem['agio'];
	let make_date = sheetItem['makeDate'] == null ? "":sheetItem['makeDate'] ;

	//升贴水有null
	if(!cash){
		cash = 0;
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
	//支持多仓库 多个仓库用逗号进行分割
	if(matchWarehouse(current_priority, w_id)){
		return true;
	}
	if(matchMakeDate(current_priority, make_date)){
		return true;
	}
	if (current_priority['district'] != '' && (null == placeName ||(placeName !=null && placeName.indexOf(current_priority['district']) < 0))) {
		return true;
	}
	if (current_priority['premium_rise_lower_limit'] != '' && parseInt(current_priority['premium_rise_lower_limit']) >= cash) {
		return true;
	}
	if (current_priority['premium_rise_upper_limit'] != '' && parseInt(current_priority['premium_rise_upper_limit']) <= cash) {
		return true;
	}

}
/**
 * 右下角读取展示条件
 * @param {Object} conditionPriorItem
 * @param {Object} index
 */
function loadupDisplayCondition(conditionPriorItem, index) {
		var conditionTr = $("<tr style='padding:10px;'></tr>");
		
		conditionTr.append("<td  style = 'width:100px;margin:5px;color: #4B73EB;'>"  + "优先度" + index + "</td>");
		let spcId = conditionPriorItem["spcId"];
		conditionTr.append("<td style = 'width:100px;margin:5px;'>"  +"仓单编号: " + spcId + "</td>");
		let district = conditionPriorItem["district"];
		let warehouse = conditionPriorItem["warehouse"];
		let make_date = conditionPriorItem["make_date"];
		let premium_rise_upper_limit = conditionPriorItem["premium_rise_upper_limit"];
		let premium_rise_lower_limit = conditionPriorItem["premium_rise_lower_limit"];
		conditionTr.append("<td style = 'width:100px;margin:5px;'>"  +"仓库: " + warehouse + "</td>");
		conditionTr.append("<td style = 'width:60px;margin:5px;'>"  +"年份: " + make_date + "</td>");
		conditionTr.append("<td style = 'width:80px;margin:5px;'>"  +"产地: " + district + "</td>");
		conditionTr.append("<td style = 'width:120px;margin:5px;'>"  +"升贴水下限: " + premium_rise_lower_limit + "</td>");
		conditionTr.append("<td style = 'width:120px;margin:5px;'>"  +"升贴水上限: " + premium_rise_upper_limit + "</td>");
		//match += "仓库: " + warehouse + "年份: " + make_date+ "产地: " + district + "升贴水下限: " + premium_rise_lower_limit + "升贴水上限: " + premium_rise_upper_limit;
	return conditionTr;
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
 * 展示条件编辑窗体
 * @param {Object} conditionPriorItem
 * @param {Object} index
 */
function conditionPanelInnerHtml(conditionPriorItem, index){

		let innerHTML = `
			<div style="display:inline;">
			优先度` + index + `:
			</div>
			<div class='condition-item'>
				<input class = "condition-input" id="spcId_` +
					index + `" placeholder="仓单编号" type="text"  value = "` + conditionPriorItem['spcId'] +
					`"/> 
			<input class = "condition-input" id="district_` + index +
					`" placeholder="产地" type="text"  value = "` + conditionPriorItem['district'] +
					`"/> 
				<input class = "condition-input" id="warehouse_` +
					index + `" placeholder="仓库" type="text"  value = "` + conditionPriorItem['warehouse'] +
					`"/> 
				<input class = "condition-input" id="make_date_` +
					index + `" placeholder="年份" type="text"  value = "` + conditionPriorItem['make_date'] +
					`"/> 
				<input class = "condition-input" id="premium_rise_lower_limit_` +
					index +
					`" type="number" placeholder="升贴水下限"  value = "` + conditionPriorItem['premium_rise_lower_limit'] +
					`"/> 
			<input class = "condition-input" id="premium_rise_upper_limit_` +
					index + `" type="number" placeholder="升贴水上限"  value = "` + conditionPriorItem['premium_rise_upper_limit'] +
					`"/> 
			</div>
				`;
	return innerHTML;
}

function addConditionPanelHtml(editPriorNum){

		let innerHTML = `
			<div style="display:inline;">
				优先度:` + editPriorNum + `
				</div>
			<div class='condition-item'>
				
			<input class = "condition-input" id="spcId_` + editPriorNum +
			`" placeholder="仓单编号" type="text"/> 
			<input class = "condition-input" id="district_` + editPriorNum +
			`" placeholder="产地" type="text"/> 
			<input class = "condition-input" id="warehouse_` +
			editPriorNum +
			`" placeholder="仓库" type="text"/> 
			<input class = "condition-input" id="make_date_` +
			editPriorNum +
			`" placeholder="年份" type="text"/> 
			<input class = "condition-input" id="premium_rise_lower_limit_` +
			editPriorNum +
			`" type="number" placeholder="升贴水下限"/>
		<input class = "condition-input" id="premium_rise_upper_limit_` +
			editPriorNum + `" type="number" placeholder="升贴水上限"/>
		</div>
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
	
	param.orderColumn="AGIO";
	param.orderDir ="ASC";
	param.formDefine=JSON.parse("{\"formDefineId\":10032,\"formId\":\"selection_query_condition\",\"formAttrDefines\":[{\"attrId\":1863,\"formAttrDefineId\":3038,\"name\":\"WH_ID\",\"bizName\":\"whId\",\"value\":null},{\"attrId\":4,\"formAttrDefineId\":3039,\"name\":\"PLACE_NAME\",\"bizName\":\"placeName\",\"value\":null},{\"attrId\":1864,\"formAttrDefineId\":3040,\"name\":\"MAKE_DATE\",\"bizName\":\"makeDate\",\"value\":null},{\"attrId\":1851,\"formAttrDefineId\":3041,\"name\":\"LEV_ID\",\"bizName\":\"levId\",\"value\":null},{\"attrId\":1871,\"formAttrDefineId\":3042,\"name\":\"AGIO\",\"bizName\":\"agio\",\"value\":null},{\"attrId\":1868,\"formAttrDefineId\":3043,\"name\":\"ITEM_ID\",\"bizName\":\"itemId\",\"value\":null}]}");
	
	return param;
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
	for (let i = 1; i <= editPriorNum; i++) {
	
	    let make_date = $('#make_date_' + i).val();
	    if(validateWarehouse(make_date) == false){
	        alert("参数错误， make_date：" + make_date);
	        return;
	    }
	}
}

function editConditionByVariety(editPriorNum, condition_num){
	validateCondition(editPriorNum);
	
	let currCondition = {};
	currCondition['amount'] = $('#amount').val()
	currCondition['condition_num'] = condition_num;
	for (let i = 1; i <= editPriorNum; i++) {
		if(!$('#district_' + i)){
			continue;
		}
		let district = $('#district_' + i).val();
		let spcId = $('#spcId_' + i).val();
		let warehouse = $('#warehouse_' + i).val();
		let make_date = $('#make_date_' + i).val();
		let premium_rise_upper_limit = $('#premium_rise_upper_limit_' + i).val();
		let premium_rise_lower_limit = $('#premium_rise_lower_limit_' + i).val();
		currCondition[i] = {
			"spcId": spcId,
			"district": district,
			"warehouse": warehouse,
			"make_date": make_date,
			"premium_rise_upper_limit": premium_rise_upper_limit,
			"premium_rise_lower_limit": premium_rise_lower_limit,
			"condition_num": condition_num
		}
	}
	return currCondition;
}

//保存输入的条件
function makeConditionStore(i, condition){
		let spcId = $('#spcId_' + i).val();
	let warehouse = $('#warehouse_' + i).val();
	let make_date = $('#make_date_' + i).val();
	
		let district = $('#district_' + i).val();
		let premium_rise_upper_limit = $('#premium_rise_upper_limit_' + i).val();
		let premium_rise_lower_limit = $('#premium_rise_lower_limit_' + i).val();
		condition[i] = {
			"spcId": spcId,
			"district": district,
			"warehouse": warehouse,
			"make_date": make_date,
			"premium_rise_upper_limit": premium_rise_upper_limit,
			"premium_rise_lower_limit": premium_rise_lower_limit,
			"condition_num": window.localStorage['condition_num']
		}
	
}
	
	//根据选中品种展示条件列表
	// function displayConditionList(tempNum){
	// 	let innerHTML = `
	// 				优先度` + tempNum + `:
	// 			<input class = "condition-input" id="district_` + tempNum +
	// 			`" placeholder="产地" type="text" /> 
	// 			<input class = "condition-input" id="warehouse_` +
	// 			tempNum +
	// 			`" placeholder="仓库" type="text" /> 
	// 			<input class = "condition-input" id="make_date_` +
	// 			tempNum +
	// 			`" placeholder="年份" type="text" /> 
	// 			<input class = "condition-input" id="premium_rise_lower_limit_` +
	// 			tempNum +
	// 			`" type="number" placeholder="升贴水下限" />
	// 		<input class = "condition-input" id="premium_rise_upper_limit_` +
	// 			tempNum + `" type="number" placeholder="升贴水上限" />
	// 		</br>
	// 		`;
	// 	
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
			<td class = "cus-td">升贴水</td>
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
				<td class = "cus-td">` + cash + `</td>
				<td class = "cus-td">` + item['priority_num'] + `</td>
				<td class = "cus-td">` + result + `</td>`;
		return innerHTML;
	}
export  {matchConditionByVariety,loadupDisplayCondition, conditionPanelInnerHtml, addConditionPanelHtml,getParam, makeConditionStore, displayWarehouseTable,displayWareHouseValue,editConditionByVariety,validateCondition}