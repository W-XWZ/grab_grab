

//品种分类
 var varietyCatalog = {
    //棉花
    CF : 'CF',
    //硅铁
    SF : 'SF',
	//苹果
	AP : 'AP',
	//甲醇
	MA : 'MA',
	//白糖
	SR : 'SR',
	//动力煤
	ZC : 'ZC',
	//锰硅
	SM : 'SM',
	//玻璃
	FG : 'FG',	
	//红枣
	CJ : 'CJ',
	//尿素
	UR : 'UR',
	//强麦
	WH : 'WH'
}

//品种代码，根据需要调整
var g_variety_id = varietyCatalog.CF;
import {matchConditionByVariety,loadupDisplayCondition, conditionPanelInnerHtml, addConditionPanelHtml,getParam, makeConditionStore,displayWarehouseTable, displayWareHouseValue, editConditionByVariety,validateCondition}
	from './variety/content-CF.js';

export {g_variety_id,varietyCatalog, matchConditionByVariety,loadupDisplayCondition, conditionPanelInnerHtml, addConditionPanelHtml,getParam, makeConditionStore, displayWarehouseTable,displayWareHouseValue, editConditionByVariety,validateCondition}
