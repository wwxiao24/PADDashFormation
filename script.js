var Cards = null; //怪物数据
var currentLanguage = null; //当前语言
var currentDataSource = null; //当前数据
const dataSourceList = [ //几个不同的游戏服务区
	{
		code:"ja",
		source:"パズル＆ドラゴンズ"
	},
	{
		code:"en",
		source:"Puzzle & Dragons"
	},
	{
		code:"ko",
		source:"퍼즐앤드래곤"
	},
];
var cardInterchange = { //记录DOM交换
	from:null,
	to:null
};
//队员基本的留空
var Member = function(){
	this.id=0;
}
Member.prototype.outObj = function(){
	var m = this;
	var obj = [m.id];
	if (m.level != undefined) obj[1] = m.level;
	if (m.awoken != undefined) obj[2] = m.awoken;
	if (m.plus != undefined && m.plus instanceof Array && m.plus.length>=3 && (m.plus[0]+m.plus[1]+m.plus[2])>0) obj[3] = m.plus;
	if (m.latent != undefined && m.latent instanceof Array && m.latent.length>=1) obj[4] = m.latent;
	if (m.sawoken != undefined) obj[5] = m.sawoken;
	return obj;
}
Member.prototype.loadObj = function(m,dataVersion){
	if (m == undefined) //如果没有提供数据，直接返回默认
	{
		return;
	}
	if (dataVersion == undefined) dataVersion = 1;
	this.id = dataVersion>1 ? m[0] : m.id;
	this.level = dataVersion>1 ? m[1] : m.level;
	this.awoken = dataVersion>1 ? m[2] : m.awoken;
	this.plus = dataVersion>1 ? m[3] : m.plus;
	if (!(this.plus instanceof Array)) this.plus = [0,0,0]; //如果潜觉不是数组，则改变
	this.latent = dataVersion>1 ? m[4] : m.latent;
	if (!(this.latent instanceof Array)) this.latent = []; //如果潜觉不是数组，则改变
	this.sawoken = dataVersion>1 ? m[5] : m.sawoken;
}
//只用来防坐的任何队员
var MemberDelay = function(){
	this.id=-1;
}
MemberDelay.prototype = Object.create(Member.prototype);
MemberDelay.prototype.constructor = MemberDelay;
//辅助队员
var MemberAssist = function(){
	this.level = 0;
	this.awoken = 0;
	this.plus = [0,0,0];
	Member.call(this);
}
MemberAssist.prototype = Object.create(Member.prototype);
MemberAssist.prototype.constructor = MemberAssist
MemberAssist.prototype.loadFromMember = function(m){
	if (m == undefined) //如果没有提供数据，直接返回默认
	{
		return;
	}
	this.id = m.id;
	if (m.level != undefined) this.level = m.level;
	if (m.awoken != undefined) this.awoken = m.awoken;
	if (m.plus != undefined && m.plus instanceof Array && m.plus.length>=3 && (m.plus[0]+m.plus[1]+m.plus[2])>0) this.plus = m.plus;
}
//正式队伍
var MemberTeam = function(){
	this.latent = [];
	this.ability = [0,0,0];
	MemberAssist.call(this);
	//sawoken作为可选项目，默认不在内
}
MemberTeam.prototype = Object.create(MemberAssist.prototype);
MemberTeam.prototype.constructor = MemberTeam;
MemberTeam.prototype.loadFromMember = function(m){
	if (m == undefined) //如果没有提供数据，直接返回默认
	{
		return;
	}
	this.id = m.id;
	if (m.level != undefined) this.level = m.level;
	if (m.awoken != undefined) this.awoken = m.awoken;
	if (m.plus != undefined && m.plus instanceof Array && m.plus.length>=3 && (m.plus[0]+m.plus[1]+m.plus[2])>0) this.plus = m.plus;
	if (m.latent != undefined && m.latent instanceof Array && m.latent.length>=1) this.latent = m.latent;
	if (m.sawoken != undefined) this.sawoken = m.sawoken;
	if (m.ability != undefined && m.ability instanceof Array && m.plus.length>=3) this.ability = m.ability;
}

var Formation = function(teamCount,memberCount){
	this.title = "",
	this.detail = "",
	this.team = [];
	this.badge = 0;
	for (var ti=0;ti<teamCount;ti++)
	{
		var team = [[],[]];
		for (var mi=0;mi<memberCount;mi++)
		{
			team[0].push(new MemberTeam());
			team[1].push(new MemberAssist());
		}
		this.team.push(team);
	}
}
Formation.prototype.outObj= function(){
	let obj = {};
	if (this.title != undefined && this.title.length>0) obj.t = this.title;
	if (this.detail != undefined && this.detail.length>0) obj.d = this.detail;
	obj.f = this.team.map(function(t){
			return t.map(function(st){
				return st.map(function(m){
					return m.outObj();
				})
			})
		});
	if (this.badge != undefined && this.badge>0) obj.b = this.badge; //徽章
	return obj;
}
Formation.prototype.loadObj= function(f){
	var dataVeision = f.f?2:1; //是第几版格式
	this.title = dataVeision>1 ? f.t : f.title;
	this.detail = dataVeision>1 ? f.d : f.detail;
	this.badge = f.b ? f.b : 0; //徽章
	var teamArr = dataVeision>1 ? f.f : f.team;
	this.team.forEach(function(t,ti){
		var tf = teamArr[ti] || [];
		t.forEach(function(st,sti){
			var fst = tf[sti] || [];
			st.forEach(function(m,mi){
				var fm = fst[mi];
				m.loadObj(fm,dataVeision);
			})
		})
	});
}
//获取最大潜觉数量
function getMaxLatentCount(id)
{ //转生2和超转生3为8个格子
	return Cards[id].is8Latent ? 8 : 6;
}
//创建一个新的怪物头像
function createCardHead(id)
{
	var cli = document.createElement("li");
	var cdom = cli.head = cli.appendChild(document.createElement("a"));
	cdom.class = "monster";
	var property = cdom.appendChild(document.createElement("div"));
	property.className = "property";
	var subproperty = cdom.appendChild(document.createElement("div"));
	subproperty.className = "subproperty";
	var cid = cdom.appendChild(document.createElement("div"));
	cid.className = "id";
	changeid({id:id},cdom);
	return cli;
}
//切换怪物ID显示
function toggleShowMonId()
{
	document.body.classList.toggle('not-show-mon-id');
}
//清除数据
function clearData()
{
	location.href=location.href.replace(location.search,'');
}
//交换AB队
function swapABteam()
{
	if (formation.team.length>0)
	{
		formation.team[0][0].splice(4, 0, formation.team[0][0].splice(0,1)[0]); //第1个数组基底删掉0并移动到4
		formation.team[0][1].splice(4, 0, formation.team[0][1].splice(0,1)[0]); //第1个数组辅助删掉0并移动到4
		formation.team[1][0].splice(0, 0, formation.team[1][0].splice(4,1)[0]); //第2个数组基底删掉4并移动到0
		formation.team[1][1].splice(0, 0, formation.team[1][1].splice(4,1)[0]); //第2个数组辅助删掉4并移动到0
		formation.team.splice(0,0,formation.team.splice(1,1)[0]); //交换AB队
	}
	creatNewUrl();
	history.go();
}
//在单人和多人之间转移数据
function swapSingleMulitple()
{
	if (solo)
	{
		//创建第二支队伍，各4个空的
		formation.team[1] = [
			Array.from(new Array(4)).map(()=>{return new MemberTeam()}),
			Array.from(new Array(4)).map(()=>{return new MemberAssist()})
		];
		//把右边的队长加到第二支队伍最后面
		formation.team[1][0].push(formation.team[0][0].splice(5,1)[0])
		formation.team[1][1].push(formation.team[0][1].splice(5,1)[0])
	}else
	{
		//把第二支队五的队长添加到最后方
		formation.team[0][0].push(formation.team[1][0][4]);
		formation.team[0][1].push(formation.team[1][1][4]);
		//删掉第二支队伍
		formation.team.splice(1,1);
	}
	location.href = creatNewUrl({url:solo?"multi.html":"solo.html",notPushState:true});
}
window.onload = function()
{
	let controlBox = document.body.querySelector(".control-box");

	//▼添加语言列表开始
	let langSelectDom = controlBox.querySelector(".languages");
	languageList.forEach(function(l){
		langSelectDom.options.add(new Option(l.name,l.i18n));
	})

	let parameter_i18n =  getQueryString("l") || getQueryString("lang"); //获取参数指定的语言
	let browser_i18n = (navigator.language || navigator.userLanguage); //获取浏览器语言
	let havingLanguage = languageList.filter(function(l){ //筛选出符合的语言
		if (parameter_i18n) //如果已指定就用指定的语言
			return parameter_i18n.indexOf(l.i18n)>=0;
		else //否则筛选浏览器默认语言
			return browser_i18n.indexOf(l.i18n)>=0;
	});
	currentLanguage = havingLanguage.length
					? havingLanguage.pop() //有语言使用最后一个
					: languageList[0]; //没有找到指定语言的情况下，自动用第一个语言（英语）
	document.head.querySelector("#language-css").href = "languages/"+currentLanguage.i18n+".css";

	let langOptionArray = Array.prototype.slice.call(langSelectDom.options);
	langOptionArray.some(function(langOpt){
		if (langOpt.value == currentLanguage.i18n)
		{
			langOpt.selected = true;
			return true;
		}
	});
	//▲添加语言列表结束
	//▼添加数据来源列表开始
	let dataSelectDom = controlBox.querySelector(".datasource");
	dataSourceList.forEach(function(ds){
		dataSelectDom.options.add(new Option(ds.source,ds.code));
	})
	let parameter_dsCode =  getQueryString("s"); //获取参数指定的数据来源
	let havingDataSource = dataSourceList.filter(function(ds){ //筛选出符合的数据源
		return ds.code == parameter_dsCode;
	});
	currentDataSource = havingDataSource.length ? havingDataSource[0]: dataSourceList[0];
	document.body.classList.add("ds-"+currentDataSource.code);
	let dataSourceOptionArray = Array.prototype.slice.call(dataSelectDom.options);
	dataSourceOptionArray.some(function(dataOpt){
		if (dataOpt.value == currentDataSource.code)
		{
			dataOpt.selected = true;
			return true;
		}
	});
	//处理返回的数据
	function dealIdata(responseText)
	{
		try
		{
			Cards = JSON.parse(responseText);
		}catch(e)
		{
			console.log("Cards数据JSON解码出错",e);
			return;
		}
		initialize();//初始化
		//如果通过的话就载入URL中的怪物数据
		reloadFormationData();
	}
	GM_xmlhttpRequest({
		method: "GET",
		url:`monsters-info/mon_${currentDataSource.code}.json`, //Cards数据文件
		onload: function(response) {
			dealIdata(response.response);
		},
		onerror: function(response) {
			let isChrome = navigator.userAgent.indexOf("Chrome") >=0;
			if (isChrome && location.host.length==0 && response.response.length>0)
			{
				console.info("因为是Chrome本地打开，正在尝试读取JSON");
				dealIdata(response.response);
			}else
			{
				console.error("Cars JSON数据获取失败",response);
			}
		}
	});
}
//重新读取URL中的Data数据并刷新页面
function reloadFormationData()
{
	let formationData;
	try
	{
		var parameter_data = getQueryString("d") || getQueryString("data");
		if (parameter_data)
		{
			formationData = JSON.parse(parameter_data);
		}
	}catch(e)
	{
		console.log("URL中队伍数据JSON解码出错",e);
		return;
	}
	if (formationData)
	{
		//formation = idata;
		formation.loadObj(formationData);
		refreshAll(formation);
	}
}
window.onpopstate = reloadFormationData; //前进后退时修改页面
//创建新的分享地址
function creatNewUrl(arg){
	if (arg == undefined) arg = {};
	if (!!(window.history && history.pushState)) {
		// 支持History API
		let language_i18n = arg.language || getQueryString("l") || getQueryString("lang"); //获取参数指定的语言
		let datasource = arg.datasource || getQueryString("s");
		let outObj = formation.outObj();
		
		let newUrl = (arg.url?arg.url:"")
		+ '?' 
		+ (language_i18n?'l=' + language_i18n + '&':'') 
		+ (datasource&&datasource!="ja"?'s=' + datasource + '&':'') 
		+ 'd=' + encodeURIComponent(JSON.stringify(outObj));

		if (!arg.notPushState) history.pushState(null, null, newUrl);
		return newUrl;
	}
}
//初始化
function initialize()
{
	let monstersList = document.querySelector("#monsters-list");
	let fragment = document.createDocumentFragment();
	Cards.forEach(function(m){ //添加下拉框候选
		let opt = fragment.appendChild(document.createElement("option"));
		opt.value = m.id;
		opt.label = m.id + " - " +  returnMonsterNameArr(m, currentLanguage.searchlist, currentDataSource.code).join(" | ");
	});
	monstersList.appendChild(fragment);

	//控制框
	const controlBox = document.querySelector(".control-box");

	//标题和介绍文本框
	const txtTitle = document.querySelector(".title-box .title");
	const txtDetail = document.querySelector(".detail-box .detail");
	txtTitle.onchange = function(){
		formation.title = this.value;
		creatNewUrl();
	}
	txtDetail.onchange = function(){
		formation.detail = this.value;
		creatNewUrl();
	}
	txtDetail.onblur = function(){
		this.style.height=this.scrollHeight+"px";
	}

	//队伍框
	const formationBox = document.querySelector(".formation-box");

	const formationA = formationBox.querySelector(".formation-box .formation-A-box");
	const formationB = formationBox.querySelector(".formation-box .formation-B-box");
	
	const fATeam = formationA.querySelectorAll(".formation-team .monster");
	const fAAssist = formationA.querySelectorAll(".formation-assist .monster");

	const fBTeam = formationB ? formationB.querySelectorAll(".formation-team .monster") : null;
	const fBAssist = formationB ? formationB.querySelectorAll(".formation-assist .monster") : null;

	for (let ti=0;ti<fATeam.length;ti++)
	{
		fATeam[ti].onclick = clickMonHead;
		fATeam[ti].ondragstart = dragStartMonHead;
		fATeam[ti].ondragover = dropOverMonHead;
		fATeam[ti].ondrop = dropMonHead;
		fATeam[ti].draggable = true;
		fAAssist[ti].onclick = clickMonHead;
		fAAssist[ti].ondragstart = dragStartMonHead;
		fAAssist[ti].ondrop = dropMonHead;
		fAAssist[ti].ondragover = dropOverMonHead;
		fAAssist[ti].draggable = true;
		if (formationB)
		{
			fBTeam[ti].onclick = clickMonHead;
			fBTeam[ti].ondragstart = dragStartMonHead;
			fBTeam[ti].ondrop = dropMonHead;
			fBTeam[ti].ondragover = dropOverMonHead;
			fBTeam[ti].draggable = true;
			fBAssist[ti].onclick = clickMonHead;
			fBAssist[ti].ondragstart = dragStartMonHead;
			fBAssist[ti].ondrop = dropMonHead;
			fBAssist[ti].ondragover = dropOverMonHead;
			fBAssist[ti].draggable = true;
		}
	}

	//徽章
	let badges = Array.prototype.slice.call(formationBox.querySelectorAll(".formation-badge .badge-bg"));
	badges.forEach((badge,bidx) => {
		badge.onclick = ()=>{
			if (badges.some(b=>{return b.classList.contains("display-none");}))
			{ //未展开时
				badges.forEach((b,idx) => {if (idx!=bidx)b.classList.remove("display-none");})
			}else
			{ //展开时
				badges.forEach((b,idx) => {if (idx!=bidx)b.classList.add("display-none");})
				formation.badge = bidx;
				refreshTotalAbility(formation.team[0]);
				creatNewUrl();
			}
		}
	})

	//编辑框
	const editBox = document.querySelector(".edit-box");
	editBox.mid = 0; //储存怪物id
	editBox.awokenCount = 0; //储存怪物潜觉数量
	editBox.latent = []; //储存潜在觉醒
	editBox.assist = false; //储存是否为辅助宠物
	editBox.monsterBox = null;
	editBox.latentBox = null;
	editBox.memberIdx = []; //储存队伍数组下标
	editBox.show = function(){
		editBox.classList.remove("display-none");
		formationBox.classList.add("blur-bg");
		controlBox.classList.add("blur-bg");
	}
	editBox.hide = function(){
		editBox.classList.add("display-none");
		formationBox.classList.remove("blur-bg");
		controlBox.classList.remove("blur-bg");
	}

	const settingBox = editBox.querySelector(".setting-box")
	//id搜索
	const monstersID = editBox.querySelector(".edit-box .m-id");
	monstersID.onchange = function(){
		if (/^\d+$/.test(this.value))
		{
			editBox.mid = parseInt(this.value);
			editBoxChangeMonId(editBox.mid);
		}
	}
	monstersID.oninput = monstersID.onchange;
	//觉醒
	let monEditAwokens = Array.prototype.slice.call(settingBox.querySelectorAll(".row-mon-awoken .awoken-ul .awoken-icon"));
	monEditAwokens.forEach(function(akDom,idx,domArr){
		akDom.onclick = function(){
			editBox.awokenCount = idx;
			editBox.reCalculateAbility();
			editBox.refreshAwokens();
		};
	});
	//刷新觉醒
	editBox.refreshAwokens = function(){
		monEditAwokens[0].innerHTML = editBox.awokenCount;
		if (editBox.awokenCount>0 && editBox.awokenCount==(Cards[editBox.mid].awoken.length))
			monEditAwokens[0].classList.add("full-awoken");
		else
			monEditAwokens[0].classList.remove("full-awoken");
		for(var ai=1;ai<monEditAwokens.length;ai++)
		{
			if(ai<=editBox.awokenCount)
			{
				monEditAwokens[ai].classList.remove("unselected-awoken");
			}
			else
			{
				monEditAwokens[ai].classList.add("unselected-awoken");
			}
		}
	}

	//超觉醒
	let monEditSAwokens = Array.prototype.slice.call(settingBox.querySelectorAll(".row-mon-super-awoken .awoken-ul .awoken-icon"));
	monEditSAwokens.forEach(function(akDom,idx,domArr){
		akDom.onclick = function(){
			for(var ai=0;ai<domArr.length;ai++)
			{
				if(ai==idx)
				{
					domArr[ai].classList.toggle("unselected-awoken");
				}
				else
				{
					domArr[ai].classList.add("unselected-awoken");
				}
			}
		}
	})

	//3个快速设置this.ipt为自己的value
	function setIptToMyValue()
	{
		if (this.ipt.value != this.value)
		{
			this.ipt.value = this.value;
			this.ipt.onchange();
		}
	}
	//等级
	const monEditLv = settingBox.querySelector(".m-level");
	monEditLv.onchange = function(){editBox.reCalculateAbility();};
	const monEditLvMin = settingBox.querySelector(".m-level-btn-min");
	monEditLvMin.ipt = monEditLv;
	monEditLvMin.onclick = setIptToMyValue;
	const monEditLvMax = settingBox.querySelector(".m-level-btn-max");
	monEditLvMax.ipt = monEditLv;
	monEditLvMax.onclick = setIptToMyValue;
	//加蛋
	const monEditAddHpLi = settingBox.querySelector(".row-mon-plus .m-plus-hp-li");
	const monEditAddAtkLi = settingBox.querySelector(".row-mon-plus .m-plus-atk-li");
	const monEditAddRcvLi = settingBox.querySelector(".row-mon-plus .m-plus-rcv-li");
	const monEditAddHp = monEditAddHpLi.querySelector(".m-plus-hp");
	monEditAddHp.onchange = function(){editBox.reCalculateAbility();};
	const monEditAddAtk = monEditAddAtkLi.querySelector(".m-plus-atk");
	monEditAddAtk.onchange = function(){editBox.reCalculateAbility();};
	const monEditAddRcv = monEditAddRcvLi.querySelector(".m-plus-rcv");
	monEditAddRcv.onchange = function(){editBox.reCalculateAbility();};
	//3个快速设置按钮
	const monEditAddHpBtn = monEditAddHpLi.querySelector(".m-plus-btn");
	monEditAddHpBtn.ipt = monEditAddHp;
	monEditAddHpBtn.onclick = setIptToMyValue;
	const monEditAddAtkBtn = monEditAddAtkLi.querySelector(".m-plus-btn");
	monEditAddAtkBtn.ipt = monEditAddAtk;
	monEditAddAtkBtn.onclick = setIptToMyValue;
	const monEditAddRcvBtn = monEditAddRcvLi.querySelector(".m-plus-btn");
	monEditAddRcvBtn.ipt = monEditAddRcv;
	monEditAddRcvBtn.onclick = setIptToMyValue;
	//297按钮
	const monEditAdd297 = settingBox.querySelector(".row-mon-plus .m-plus-btn-297");
	monEditAdd297.onclick = ()=>{
		monEditAddHp.value = 
		monEditAddAtk.value = 
		monEditAddRcv.value = 99;
		editBox.reCalculateAbility();
	}
	//三维的计算值
	const monEditHpValue = monEditAddHpLi.querySelector(".ability-value");
	const monEditAtkValue = monEditAddAtkLi.querySelector(".ability-value");
	const monEditRcvValue = monEditAddRcvLi.querySelector(".ability-value");
	
	//潜觉
	const monEditLatentUl = settingBox.querySelector(".m-latent-ul");
	let monEditLatents = Array.prototype.slice.call(monEditLatentUl.querySelectorAll("li"));
	const monEditLatentAllowableUl = settingBox.querySelector(".m-latent-allowable-ul");
	let monEditLatentsAllowable = Array.prototype.slice.call(monEditLatentAllowableUl.querySelectorAll("li"));
	editBox.refreshLatent = function(latent,monid) //刷新潜觉
	{
		let maxLatentCount = getMaxLatentCount(monid); //最大潜觉数量
		let usedHoleN = usedHole(latent);
		for (var ai=0;ai<monEditLatents.length;ai++)
		{
			if (latent[ai] !== undefined)
			{
				monEditLatents[ai].className = "latent-icon latent-icon-" + latent[ai];
				monEditLatents[ai].value = ai;
			}
			else if(ai<(maxLatentCount-usedHoleN+latent.length))
			{
				monEditLatents[ai].className = "latent-icon";
				monEditLatents[ai].value = -1;
			}
			else
			{
				monEditLatents[ai].className = "display-none";
				monEditLatents[ai].value = -1;
			}
		}
	}

	function deleteLatent(){
		let aIdx = parseInt(this.value, 10);
		editBox.latent.splice(aIdx,1);
		editBox.reCalculateAbility(); //重计算三维
		editBox.refreshLatent(editBox.latent,editBox.mid); //刷新潜觉
	}
	//已有觉醒的去除
	monEditLatents.forEach(function(l){
		l.onclick = deleteLatent;
	})
	//可选觉醒的添加
	monEditLatentsAllowable.forEach(function(la){
		la.onclick = function(){
			if (this.classList.contains("unselected-latent")) return;
			var lIdx = parseInt(this.value);
			var usedHoleN = usedHole(editBox.latent);
			let maxLatentCount = getMaxLatentCount(editBox.mid); //最大潜觉数量
			if (lIdx >= 12 && usedHoleN<=(maxLatentCount-2))
				editBox.latent.push(lIdx);
			else if (lIdx < 12 && usedHoleN<=(maxLatentCount-1))
				editBox.latent.push(lIdx);

			editBox.reCalculateAbility();
			editBox.refreshLatent(editBox.latent,editBox.mid);
		}
	})

	//重新计算怪物的能力
	editBox.reCalculateAbility = function(){
		const monid = parseInt(monstersID.value || 0, 10);
		const level = parseInt(monEditLv.value || 0, 10);
		const awoken = editBox.awokenCount;
		const plus = [
			parseInt(monEditAddHp.value || 0, 10),
			parseInt(monEditAddAtk.value || 0, 10),
			parseInt(monEditAddRcv.value || 0, 10)
		];
		const latent = editBox.latent;
		const abilitys = calculateAbility(monid,level,plus,awoken,latent) || [0,0,0];

		monEditHpValue.innerHTML = abilitys[0];
		monEditAtkValue.innerHTML = abilitys[1];
		monEditRcvValue.innerHTML = abilitys[2];
	}

	const btnCancel = editBox.querySelector(".button-cancel");
	const btnDone = editBox.querySelector(".button-done");
	const btnNull = editBox.querySelector(".button-null");
	const btnDelay = editBox.querySelector(".button-delay");
	btnCancel.onclick = function(){
		btnDone.classList.remove("cant-assist");
		btnDone.disabled = false;
		editBox.memberIdx = [];
		editBox.hide();
	}
	btnDone.onclick = function(){
		if (parseInt(monEditLv.value,10) == 0)
		{
			btnNull.onclick();
			return;
		}
		let mon = editBox.assist?new MemberAssist():new MemberTeam();
		formation.team[editBox.memberIdx[0]][editBox.memberIdx[1]][editBox.memberIdx[2]] = mon;

		mon.id = parseInt(monstersID.value,10);
		const card = Cards[mon.id];
		mon.level = parseInt(monEditLv.value,10);
		mon.awoken = editBox.awokenCount;
		if (card.superAwakenings.length) //如果支持超觉醒
		{
			mon.sawoken = -1;
			for (var sai = 0;sai<monEditSAwokens.length;sai++)
			{
				if (
					!monEditSAwokens[sai].classList.contains("unselected-awoken") &&
					!monEditSAwokens[sai].classList.contains("display-none")
				)
				{
					mon.sawoken = sai;
					break;
				}
			}
		}
		
		if (card.types.some(t=>{return t == 0 || t == 12 || t == 14 || t == 15;})
		&& (!card.overlay || mon.level>= card.maxLevel))
		{ //当4种特殊type的时候是无法297和打觉醒的，但是不能叠加的在未满级时可以
			mon.plus = [0,0,0]; 
		}else
		{
			mon.plus[0] = parseInt(monEditAddHp.value) || 0;
			mon.plus[1] = parseInt(monEditAddAtk.value) || 0;
			mon.plus[2] = parseInt(monEditAddRcv.value) || 0;
			if (!editBox.assist)
			{ //如果不是辅助，则可以设定潜觉
				mon.latent = editBox.latent.concat();
			}
		}

		changeid(mon,editBox.monsterBox,editBox.latentBox);

		var formationAbilityDom = document.querySelector(".formation-box .formation-ability");
		if (formationAbilityDom)
		{
			refreshAbility(
				formationAbilityDom,
				formation.team[editBox.memberIdx[0]],
				editBox.memberIdx[2]);
			refreshTotalAbility(formation.team[editBox.memberIdx[0]]);
		}
		refreshAwokenCount(formation.team);
		creatNewUrl();
		editBox.hide();
	}
	window.onkeydown = function(e){
		if (!editBox.classList.contains("display-none"))
		{
			if (e.keyCode == 27)
			{ //按下ESC时，自动关闭编辑窗
				btnCancel.onclick();
			}
		}
	}
	btnNull.onclick = function(){
		var mD = formation.team[editBox.memberIdx[0]][editBox.memberIdx[1]][editBox.memberIdx[2]] = new Member();
		changeid(mD,editBox.monsterBox,editBox.latentBox);
		var formationAbilityDom = document.querySelector(".formation-box .formation-ability");
		if (formationAbilityDom)
		{
			refreshAbility(
				formationAbilityDom,
				formation.team[editBox.memberIdx[0]],
				editBox.memberIdx[2]);
			refreshTotalAbility(formation.team[editBox.memberIdx[0]]);
		}
		refreshAwokenCount(formation.team);
		creatNewUrl();
		editBox.hide();
	}
	btnDelay.onclick = function(){ //应对威吓
		var mD = formation.team[editBox.memberIdx[0]][editBox.memberIdx[1]][editBox.memberIdx[2]] = new MemberDelay();
		changeid(mD,editBox.monsterBox,editBox.latentBox);
		var formationAbilityDom = document.querySelector(".formation-box .formation-ability");
		if (formationAbilityDom)
		{
			refreshAbility(
				formationAbilityDom,
				formation.team[editBox.memberIdx[0]],
				editBox.memberIdx[2]);
			refreshTotalAbility(formation.team[editBox.memberIdx[0]]);
		}
		refreshAwokenCount(formation.team);
		creatNewUrl();
		editBox.hide();
	}
	
	//语言选择
	const langList = controlBox.querySelector(".languages");
	langList.onchange = function(){
		creatNewUrl({"language":this.value});
		history.go();
	}
	//数据源选择
	const dataList = controlBox.querySelector(".datasource");
	dataList.onchange = function(){
		creatNewUrl({datasource:this.value});
		history.go();
	}

	/*添对应语言执行的JS*/
	const languageJS = document.head.appendChild(document.createElement("script"));
	languageJS.id = "language-js";
	languageJS.type = "text/javascript";
	languageJS.src = "languages/"+currentLanguage.i18n+".js";
}
//编辑界面点击每个怪物的头像的处理
function clickMonHead()
{
	let team = parseInt(this.getAttribute("data-team"),10);
	let assist = parseInt(this.getAttribute("data-assist"),10);
	let index = parseInt(this.getAttribute("data-index"),10);
	editMon(team,assist,index);
	return false; //没有false将会打开链接
}
//编辑界面每个怪物的头像的拖动
function dragStartMonHead(e)
{
	let team = parseInt(this.getAttribute("data-team"),10);
	let assist = parseInt(this.getAttribute("data-assist"),10);
	let index = parseInt(this.getAttribute("data-index"),10);
	e.dataTransfer.setData('from',[team,assist,index].join(","));
}
//编辑界面每个怪物的头像的经过，阻止事件发生
function dropOverMonHead(e)
{
	e.preventDefault();
}
//编辑界面每个怪物的头像的放下
function dropMonHead(e)
{
	let dataFrom = e.dataTransfer.getData('from').split(",").map((i)=>{return parseInt(i,10);});
	let team = parseInt(this.getAttribute("data-team"),10);
	let assist = parseInt(this.getAttribute("data-assist"),10);
	let index = parseInt(this.getAttribute("data-index"),10);
	let dataTo = [team,assist,index];

	if ((dataTo[0] != dataFrom[0])
	|| (dataTo[1] != dataFrom[1])
	|| (dataTo[2] != dataFrom[2]))
	{ //必须有所不同才继续交换
		interchangeCard(dataFrom,dataTo);
	}
	return false; //没有false将会打开链接
}
function interchangeCard(formArr,toArr)
{
	function changeType(member,isAssist)
	{
		if (member.id == 0 || (isAssist && member.id == -1))
		{
			return new Member;
		}else
		{
			let newMember = isAssist ? new MemberTeam() : new MemberAssist();
			newMember.loadFromMember(member);
			return newMember;
		}
	}
	let from = formation.team[formArr[0]][formArr[1]][formArr[2]];
	let to = formation.team[toArr[0]][toArr[1]][toArr[2]];
	if(formArr[1] != toArr[1]) //从武器拖到非武器才改变类型
	{
		from = changeType(from,formArr[1]);
		to = changeType(to,toArr[1]);
	}
	formation.team[toArr[0]][toArr[1]][toArr[2]] = from;
	formation.team[formArr[0]][formArr[1]][formArr[2]] = to;

	creatNewUrl(); //刷新URL
	refreshAll(formation); //刷新全部
}
//改变一个怪物头像
function changeid(mon,monDom,latentDom)
{
	let fragment = document.createDocumentFragment(); //创建节点用的临时空间
	const parentNode = monDom.parentNode;
	fragment.appendChild(monDom);
	const monId = mon.id;
	const card = Cards[monId]; //怪物固定数据
	monDom.setAttribute("data-cardid", monId); //设定新的id
	if (monId<0) //如果是延迟
	{
		parentNode.classList.add("delay");
		parentNode.classList.remove("null");
		return;
	}else if (monId==0) //如果是空
	{
		parentNode.classList.add("null");
		parentNode.classList.remove("delay");
		return;
	}else (monId>-1) //如果提供了id
	{
		parentNode.classList.remove("null");
		parentNode.classList.remove("delay");
		monDom.className = "monster";
		monDom.classList.add("pet-cards-" + Math.ceil(monId/100)); //添加图片编号
		const idxInPage = (monId-1) % 100; //获取当前页面的总序号
		monDom.classList.add("pet-cards-index-x-" + idxInPage % 10); //添加X方向序号
		monDom.classList.add("pet-cards-index-y-" + parseInt(idxInPage / 10)); //添加Y方向序号
		monDom.querySelector(".property").className = "property property-" + card.attrs[0]; //主属性
		monDom.querySelector(".subproperty").className = "subproperty subproperty-" + card.attrs[1]; //副属性
		monDom.title = "No." + monId + " " + card.otLangName[currentLanguage.searchlist[0]] || card.name;
		monDom.href = monId.toString().replace(/^(\d+)$/ig,currentLanguage.guideURL);
	}
	const levelDom = monDom.querySelector(".level");
	if (levelDom) //如果提供了等级
	{
		const level = mon.level || 1;
		levelDom.innerHTML = level;
		if (level == card.maxLevel)
		{ //如果等级刚好等于最大等级，则修改为“最大”的字
			levelDom.classList.add("max");
		}else
		{
			levelDom.classList.remove("max");
		}
		if (card.limitBreakIncr && level >= card.maxLevel)
		{ //如果支持超觉，并且等级超过99，就添加支持超觉的蓝色
			levelDom.classList.add("_110");
		}else
		{
			levelDom.classList.remove("_110");
		}
	}
	if (mon.awoken>-1) //如果提供了觉醒
	{
		const awokenIcon = monDom.querySelector(".awoken-count");
		if (mon.awoken == 0 || card.awakenings.length < 1 || !awokenIcon) //没觉醒
		{
			awokenIcon.classList.add("display-none");
			awokenIcon.innerHTML = "";
		}else
		{
			awokenIcon.classList.remove("display-none");
			awokenIcon.innerHTML = mon.awoken;
			if (mon.awoken == card.awakenings.length)
			{
				awokenIcon.classList.add("full-awoken");
				if (card.canAssist)
				{//可以辅助的满觉醒打黄色星星
					awokenIcon.classList.add("allowable-assist");
				}else 
				{
					awokenIcon.classList.remove("allowable-assist");
				}
			}else
			{
				awokenIcon.classList.remove("full-awoken");
				awokenIcon.classList.remove("allowable-assist");
			}
			
		}
	}
	const sawoken = monDom.querySelector(".super-awoken");
	if (sawoken) //如果存在超觉醒的DOM且提供了超觉醒
	{
		if (mon.sawoken !== undefined && mon.sawoken>=0 && card.superAwakenings.length)
		{
			const sawokenIcon = sawoken.querySelector(".awoken-icon");
			sawoken.classList.remove("display-none");
			sawokenIcon.className = "awoken-icon awoken-" + card.superAwakenings[mon.sawoken];
		}else
		{
			sawoken.classList.add("display-none");
		}
	}
	const m_id = monDom.querySelector(".id");
	if (m_id) //怪物ID
	{
		m_id.innerHTML = monId;
	}
	const plusArr = mon.plus || [0,0,0];
	const plusDom = monDom.querySelector(".plus");
	if (plusArr && plusDom) //如果提供了加值，且怪物头像内有加值
	{
		plusDom.querySelector(".hp").innerHTML = plusArr[0];
		plusDom.querySelector(".atk").innerHTML = plusArr[1];
		plusDom.querySelector(".rcv").innerHTML = plusArr[2];
		var plusCount = plusArr[0]+plusArr[1]+plusArr[2];
		if (plusCount >= 297)
		{
			plusDom.classList.add("has297");
			plusDom.classList.remove("zero");
		}else if (plusCount <= 0)
		{
			plusDom.classList.add("zero");
			plusDom.classList.remove("has297");
		}else
		{
			plusDom.classList.remove("zero");
			plusDom.classList.remove("has297");
		}
	}
	if (latentDom && mon.latent) //如果提供了潜觉
	{
		var latent = mon.latent.sort(function(a,b){
			if(b>=12 && a<12) {return 1;} //如果大于12，就排到前面
			else if(b<12 && a>=12) {return -1} //如果小于12就排到后面
			else {return 0} //其他情况不变
		});
		if (latent.length < 1)
			latentDom.classList.add("display-none");
		else
			latentDom.classList.remove("display-none");
		var latentDoms = Array.prototype.slice.call(latentDom.querySelectorAll("li"));
		var usedHoleN = usedHole(latent);
		let maxLatentCount = getMaxLatentCount(mon.id); //最大潜觉数量
		for (var ai=0;ai<latentDoms.length;ai++)
		{
			if (latent[ai])
			{
				latentDoms[ai].className = "latent-icon latent-icon-" + latent[ai];
			}
			else if(ai<(maxLatentCount-usedHoleN+latent.length))
			{
				latentDoms[ai].className = "latent-icon";
			}
			else
			{
				latentDoms[ai].className = "display-none";
			}
		}
	}
	parentNode.appendChild(fragment);
}
//点击怪物头像，出现编辑窗
function editMon(AorB,isAssist,tempIdx)
{
	//数据
	let mD = formation.team[AorB][isAssist][tempIdx];
	let card = Cards[mD.id] || Cards[0];

	//对应的Dom
	const formationBox = document.querySelector(".formation-box .formation-"+(AorB?"B":"A")+"-box");
	
	const teamBox = formationBox.querySelector(isAssist?".formation-assist":".formation-team");
	const memberBox = teamBox.querySelector(".member-" + (tempIdx+1));

	const editBox = document.querySelector(".edit-box");
	const monsterBox = memberBox.querySelector(".monster");

	editBox.show();

	editBox.assist = isAssist;
	editBox.monsterBox = monsterBox;
	editBox.memberIdx = [AorB,isAssist,tempIdx]; //储存队伍数组下标
	editBox.assist = isAssist;
	if (!isAssist)
	{
		var latentBox = formationBox.querySelector(".formation-latents .latents-"+(tempIdx+1)+" .latent-ul");
		editBox.latentBox = latentBox;
	}

	var monstersID = editBox.querySelector(".search-box .m-id");
	monstersID.value = mD.id>0?mD.id:0;
	monstersID.onchange();
	var settingBox = editBox.querySelector(".setting-box");
	//觉醒
	var monEditAwokens = settingBox.querySelectorAll(".row-mon-awoken .awoken-ul .awoken-icon");
	if (mD.awoken>0 && monEditAwokens[mD.awoken]) monEditAwokens[mD.awoken].onclick();
	//超觉醒
	var monEditSAwokens = settingBox.querySelectorAll(".row-mon-super-awoken .awoken-ul .awoken-icon");
	if (mD.sawoken>=0 && monEditSAwokens[mD.sawoken]) monEditSAwokens[mD.sawoken].onclick();
	var monEditLv = settingBox.querySelector(".m-level");
	monEditLv.value = mD.level || 1;
	var monEditAddHp = settingBox.querySelector(".m-plus-hp");
	var monEditAddAtk = settingBox.querySelector(".m-plus-atk");
	var monEditAddRcv = settingBox.querySelector(".m-plus-rcv");
	if (mD.plus)
	{
		monEditAddHp.value = mD.plus[0];
		monEditAddAtk.value = mD.plus[1];
		monEditAddRcv.value = mD.plus[2];
	}
	var btnDelay = editBox.querySelector(".button-delay");
	if (!isAssist)
	{
		editBox.latent = mD.latent?mD.latent.concat():[];
		editBox.refreshLatent(editBox.latent,mD.id);
		btnDelay.classList.add("display-none");
		settingBox.querySelector(".row-mon-latent").classList.remove("display-none");
		if (Cards[mD.id].sAwoken)settingBox.querySelector(".row-mon-super-awoken").classList.remove("display-none");
		editBox.querySelector(".edit-box-title").classList.remove("edit-box-title-assist");
	}else
	{
		btnDelay.classList.remove("display-none");
		settingBox.querySelector(".row-mon-latent").classList.add("display-none");
		settingBox.querySelector(".row-mon-super-awoken").classList.add("display-none");
		editBox.querySelector(".edit-box-title").classList.add("edit-box-title-assist");
	}
	editBox.reCalculateAbility();
}
//编辑窗，修改怪物ID
function editBoxChangeMonId(id)
{
	const card = Cards[id]; //怪物固定数据
	if (!card){
		id = 0;
		card = Cards[0]
	}
	const editBox = document.querySelector(".edit-box");
	//id搜索
	const monstersID = editBox.querySelector(".edit-box .m-id");
	const monInfoBox = editBox.querySelector(".monsterinfo-box");
	const monHead = monInfoBox.querySelector(".monster");
	changeid({id:id},monHead); //改变图像
	const mId = monInfoBox.querySelector(".monster-id");
	mId.innerHTML = id;
	const mRare = monInfoBox.querySelector(".monster-rare");
	mRare.className = "monster-rare rare-" + card.rarity;
	const mName = monInfoBox.querySelector(".monster-name");
	mName.innerHTML = returnMonsterNameArr(card, currentLanguage.searchlist, currentDataSource.code)[0];

	var evoCardUl = document.querySelector(".edit-box .search-box .evo-card-list");
	//var evoRootId = parseInt(evoCardUl.getAttribute("data-evoRootId")); //读取旧的id
	//evoCardUl.setAttribute("data-evoRootId",card.evoRootId); //设定新的id
	var evoLinkCardsId = Cards.filter(function(m){
		return m.evoRootId == card.evoRootId && m.id != card.id;
	}).map(function(m){return m.id;});
	for (var ci=evoCardUl.childNodes.length-1;ci>=0;ci--)
	{ //删除所有旧内容
		let childN = evoCardUl.childNodes[ci];
		//if (evoLinkCardsId.indexOf(parseInt(childN.getAttribute("data-cardid")))<0)
		//{
		childN.remove();
		childN = null;
		//}
	}
	evoLinkCardsId.forEach(function(mid){
		const cli = createCardHead(mid);
		cli.head.onclick = function(){
			monstersID.value = this.getAttribute("data-cardid");
			monstersID.onchange();
			return false;
		}
		evoCardUl.appendChild(cli);
	});

	var mType = monInfoBox.querySelectorAll(".monster-type li");
	for (let ti=0;ti<mType.length;ti++)
	{
		if (ti<card.types.length)
		{
			mType[ti].className = "type-name type-name-" + card.types[ti];
			mType[ti].firstChild.className = "type-icon type-icon-" + card.types[ti];
		}else
		{
			mType[ti].className = "display-none";
		}
	}

	var settingBox = editBox.querySelector(".setting-box");
	var mAwoken = settingBox.querySelectorAll(".row-mon-awoken .awoken-ul li");
	editBox.awokenCount = card.awakenings.length;
	mAwoken[0].innerHTML = editBox.awokenCount ? "★" : "0";
	for (let ai=1;ai<mAwoken.length;ai++)
	{
		if (ai<card.awakenings.length)
		{
			mAwoken[ai].className = "awoken-icon awoken-" + card.awakenings[ai-1];
		}else
		{
			mAwoken[ai].className = "display-none";
		}
	}

	//超觉醒
	var mSAwokenRow = settingBox.querySelector(".row-mon-super-awoken");
	var mSAwoken = mSAwokenRow.querySelectorAll(".awoken-ul li");
	if (!editBox.assist && card.superAwakenings.length>0)
	{
		mSAwokenRow.classList.remove("display-none");
		for (let ai=0;ai<mSAwoken.length;ai++)
		{
			if (ai < card.superAwakenings.length)
			{
				mSAwoken[ai].className = "awoken-icon unselected-awoken awoken-" + card.superAwakenings[ai];
			}
			else
			{
				mSAwoken[ai].className = "display-none";
			}
		}
	}else
	{
		mSAwokenRow.classList.add("display-none");
	}

	var monEditLvMax = settingBox.querySelector(".m-level-btn-max");
	monEditLvMax.innerHTML = monEditLvMax.value = card.maxLevel + (card.limitBreakIncr ? 11 : 0); //最大等级按钮
	var monEditLv = settingBox.querySelector(".m-level");
	monEditLv.value = card.maxLevel; //默认等级为最大等级而不是110

	var rowPlus =  settingBox.querySelector(".row-mon-plus");
	var rowLatent =  settingBox.querySelector(".row-mon-latent");
	if (card.overlay)
	{ //当可以叠加时，不能打297和潜觉
		rowPlus.classList.add("disabled"); 
		rowLatent.classList.add("disabled"); 
	}else
	{
		rowPlus.classList.remove("disabled"); 
		rowLatent.classList.remove("disabled"); 
	}
	var monLatentAllowUl = rowLatent.querySelector(".m-latent-allowable-ul");
	//该宠Type允许的杀
	var allowLatent = uniq(card.types.reduce(function (previous, t, index, array) {
		return previous.concat(type_allowable_latent[t]);
	},[]));
	for(var li=17;li<=24;li++)
	{
		var latentDom = monLatentAllowUl.querySelector(".latent-icon-" + li);
		if (allowLatent.indexOf(li)>=0)
		{
			if(latentDom.classList.contains("unselected-latent"))
				latentDom.classList.remove("unselected-latent");
		}else
		{
			if(!latentDom.classList.contains("unselected-latent"))
				latentDom.classList.add("unselected-latent");
		}
	}

	if (editBox.assist)
	{
		var btnDone = editBox.querySelector(".button-done");
		if (!card.canAssist)
		{
			btnDone.classList.add("cant-assist");
			btnDone.disabled = true;
		}else
		{
			btnDone.classList.remove("cant-assist");
			btnDone.disabled = false;
		}
	}
	editBox.latent.length = 0;
	editBox.refreshLatent(editBox.latent,id);
	editBox.reCalculateAbility();
}
//刷新整个队伍
function refreshAll(formationData){
	const txtTitle = document.querySelector(".title-box .title");
	const txtDetail = document.querySelector(".detail-box .detail");
	txtTitle.value = formationData.title || "";
	txtDetail.value = formationData.detail || "";
	txtDetail.onblur();
	
	const badges = Array.prototype.slice.call(document.querySelectorAll(".formation-box .formation-badge .badge-bg"));
	badges.forEach((b,idx)=>{
		if (idx==formationData.badge)
		{
			b.classList.remove("display-none");
		}else
		{
			b.classList.add("display-none");
		}
	})

	const formationA = document.querySelector(".formation-box .formation-A-box");
	const formationB = document.querySelector(".formation-box .formation-B-box");
	
	const fATeam = formationA.querySelectorAll(".formation-team .monster");
	const fALatents = formationA.querySelectorAll(".formation-latents .latent-ul");
	const fAAssist = formationA.querySelectorAll(".formation-assist .monster");
	
	const fBTeam = formationB ? formationB.querySelectorAll(".formation-team .monster") : null;
	const fBLatents = formationB ? formationB.querySelectorAll(".formation-latents .latent-ul") : null;
	const fBAssist = formationB ? formationB.querySelectorAll(".formation-assist .monster") : null;

	const formationAbilityDom = document.querySelector(".formation-box .formation-ability");
	for (let ti=0;ti<(formationB?5:6);ti++)
	{
		changeid(formationData.team[0][0][ti],fATeam[ti],fALatents[ti]);
		changeid(formationData.team[0][1][ti],fAAssist[ti]);
		if (formationAbilityDom)
		{
			refreshAbility(
				formationAbilityDom,
				formationData.team[0],
				ti);
			refreshTotalAbility(formationData.team[0]);
		}
		if (formationB)
		{
			changeid(formationData.team[1][0][ti],fBTeam[ti],fBLatents[ti]);
			changeid(formationData.team[1][1][ti],fBAssist[ti]);
		}
	}
	refreshAwokenCount(formationData.team);
}
//刷新觉醒总计
function refreshAwokenCount(teams){
	var awokenUL = document.querySelector(".awoken-total-box .awoken-ul");
	function setCount(idx,number){
		var aicon = awokenUL.querySelector(".awoken-" + idx);
		if (!aicon) return; //没有这个觉醒就撤回 
		var ali = aicon.parentNode;
		var countDom = ali.querySelector(".count");
		countDom.innerHTML = number;
		if (number)
			ali.classList.remove("display-none");
		else
			ali.classList.add("display-none");
	}
	var bigAwoken = [52,53,56,68,69,70]; //等于几个小觉醒的大觉醒
	for (var ai=1;ai<=72;ai++)
	{
		if (ai == 10) //防封
		{
			setCount(ai,awokenCountInFormation(teams,ai,solo)+awokenCountInFormation(teams,52,solo)*2);
		}else if (ai == 11) //防暗
		{
			setCount(ai,awokenCountInFormation(teams,ai,solo)+awokenCountInFormation(teams,68,solo)*5);
		}else if (ai == 12) //防废
		{
			setCount(ai,awokenCountInFormation(teams,ai,solo)+awokenCountInFormation(teams,69,solo)*5);
		}else if (ai == 13) //防毒
		{
			setCount(ai,awokenCountInFormation(teams,ai,solo)+awokenCountInFormation(teams,70,solo)*5);
		}else if (ai == 19) //手指
		{
			setCount(ai,awokenCountInFormation(teams,ai,solo)+awokenCountInFormation(teams,53,solo)*2);
		}else if (ai == 21) //SB
		{
			setCount(ai,awokenCountInFormation(teams,ai,solo)+awokenCountInFormation(teams,56,solo)*2);
		}else if (bigAwoken.indexOf(ai)>=0) //属于大觉醒
		{
			continue;
		}else
		{
			setCount(ai,awokenCountInFormation(teams,ai,solo));
		}
	}
}
//刷新能力值
function refreshAbility(dom,team,idx){
	var ali = dom.querySelector(".abilitys-" + (idx+1));
	var mainMD = team[0][idx];
	var assistMD = team[1][idx];
	var bonusScale = [0.1,0.05,0.15]; //辅助宠物附加的属性
	//基底三维，如果辅助是武器，还要加上辅助的觉醒
	var mainAbility = calculateAbility(mainMD.id,mainMD.level,mainMD.plus,mainMD.awoken,mainMD.latent,assistMD.id,assistMD.awoken);
	//辅助增加的三维，如果辅助的主属性相等，辅助宠物只计算等级和加值，不计算觉醒
	let mainCard = Cards[mainMD.id] || Cards[0];
	let assistCard = Cards[assistMD.id] || Cards[0];
	var assistAbility = (assistMD.id > 0 && mainCard.attrs[0]==assistCard.attrs[0])
		?calculateAbility(assistMD.id,assistMD.level,assistMD.plus,null,null)
		:[0,0,0];
	if (mainAbility && mainMD.ability)
	{
		for (let ai=0;ai<3;ai++)
		{
			mainMD.ability[ai] = mainAbility[ai] + Math.round(assistAbility[ai]*bonusScale[ai]);
		}
	}
	var hpDom = ali.querySelector(".hp");
	var atkDom = ali.querySelector(".atk");
	var rcvDom = ali.querySelector(".rcv");
	[hpDom,atkDom,rcvDom].forEach(function(div,ai){
		if (mainAbility)
		{
			div.classList.remove("display-none");
			div.innerHTML = mainMD.ability[ai];
		}else
		{
			div.classList.add("display-none");
			div.innerHTML = 0;
		}
	});
}
//刷新能力值合计
function refreshTotalAbility(team){
	//计算总的生命值
	let tHpDom = document.querySelector(".formation-box .team-info .tIf-total-hp");
	let tRcvDom = document.querySelector(".formation-box .team-info .tIf-total-rcv");
	let tHP = team[0].reduce(function(value,mon){ //队伍计算的总HP
		return value += mon.ability ? mon.ability[0] : 0;
	},0);
	let teamHPAwoken = awokenCountInTeam(team,46,solo); //全队血包个数
	//let tHPwithAwoken = Math.round(tHP * (1 + awokenCountInTeam(team,46,solo) * 0.05)); //全队血包
	let badgeHPScale = 1; //徽章倍率
	if (formation.badge == 4)
	{
		badgeHPScale = 1.05;
	}else if (formation.badge == 11)
	{
		badgeHPScale = 1.15;
	}
	let tRCV = team[0].reduce(function(value,mon){ //队伍计算的总回复
		return value += mon.ability ? mon.ability[2] : 0;
	},0);
	let teamRCVAwoken = awokenCountInTeam(team,47,solo); //全队回复个数
	//let tRCVwithAwoken = Math.round(tRCV * (1 + awokenCountInTeam(team,47,solo) * 0.10)); //全队回复
	let badgeRCVScale = 1; //徽章倍率
	if (formation.badge == 3)
	{
		badgeRCVScale = 1.25;
	}else if (formation.badge == 10)
	{
		badgeRCVScale = 1.35;
	}
	tHpDom.innerHTML = tHP.toString() + 
		(teamHPAwoken>0||badgeHPScale>1 
			? ("("+Math.round(tHP * (1 + 0.05 * teamHPAwoken)*badgeHPScale).toString()+")")
			: "");
	tRcvDom.innerHTML = tRCV.toString() + 
		(teamRCVAwoken>0||badgeRCVScale>1 
			? ("("+Math.round(tRCV * (1 + 0.10 * teamRCVAwoken)*badgeRCVScale).toString()+")")
			: "");
}