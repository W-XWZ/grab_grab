
import {varietyCatalog,g_variety_id, makeConditionStore, addConditionPanelHtml, validateCondition} from './public-variety.js';

$(function() {


	//加载设置
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request == "getready") {
			$('#add').attr('disabled', 'true');
		}
		sendResponse('我是popup，我已收到你的消息：' + JSON.stringify(request));
	});

	function getCurrentTabId(callback) {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function(tabs) {
			if (callback) callback(tabs.length ? tabs[0].id : null);
		});
	}

	function sendMessageToContentScript(message, callback) {
		getCurrentTabId(function(tabId) {
			chrome.tabs.sendMessage(tabId, message, function(response) {
				if (callback) callback(response);
			});
		});
	}
	


	/**
	 * 验证仓库或年份输入格式
	 * @param obj
	 * @returns {boolean}
	 */
	function validateWarehouseOrMakedate(obj) {
		let pattern = /^[0-9,]*$/;
		let reg = new RegExp(pattern);
		if ("" == obj) {
			return true;
		}
		if (!reg.test(obj)) {
			return false;
		}
		return true;
	}

	let condition = {};
	//获取唯一的condition_num 组装优先度组并向页面推送
	$('#add').on('click', function() {
		if (!window.localStorage['condition_num']) {
			window.localStorage['condition_num'] = 1;
		} else {
			window.localStorage['condition_num'] = parseInt(window.localStorage['condition_num']) + 1;
		}
		//参数校验
		if (!$('#amount').val()) {

			alert("必须填写仓单数量");
			return;
		}
		//需要规范化统一
		validateCondition(tempNum - 1)
		
		condition['amount'] = $('#amount').val();
		condition["condition_num"] = window.localStorage['condition_num'];
		
		for (let i = 1; i < tempNum; i++) {
			makeConditionStore( i, condition);
		}
		sendMessageToContentScript({
			"action": "addIntoConditions",
			"condition": JSON.stringify(condition)
		}, function(response) {});
	});


	//全局优先级级别
	var tempNum = 1;
	$('#delPriority').on('click', function() {
		delClick();
	});
	$('#addPriority').on('click', function() {
		addClick();
	});
	
	//初始化一条
	addClick();

	function addClick() {
		
		if (tempNum >= 11) {
			alert("最多10个优先级");
			return
		}
		
		let div = document.getElementById("main")
		let panel = document.createElement('div');
		panel.id = "div" + tempNum;
		panel.style.zIndex = 99999;
		panel.className = 'chrome-plugin-demo-panel';
		
		panel.innerHTML = addConditionPanelHtml( tempNum);
		div.appendChild(panel);
		tempNum++;
	}
	
	function delClick() {
		if (tempNum == 2) {
			alert("只剩最后一条了，无法删除");
			return;
		}
		tempNum--;
		$("#div" + tempNum).remove();
	}
	

});
