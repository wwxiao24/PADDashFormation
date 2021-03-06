﻿const fs = require('fs');
const crypto = require('crypto');
const Card = require('./official-API/parseCard');
const Skill = require('./official-API/parseSkill');
const runDate = new Date();
const officialAPI = [ //来源于官方API
	{
		code:"ja",
		customName:["cht","chs"]
	},
	{
		code:"en",
		customName:[]
	},
	{
		code:"ko",
		customName:[]
	}
];

//比较两只怪物是否是同一只（在不同语言服务器）
function sameCard(m1,m2)
{
	if (m1 == undefined || m2 == undefined) return false; //是否存在
	if (m1.attrs[0] != m2.attrs[0]) return false; //主属性
	if (m1.attrs[1] != m2.attrs[1]) return false; //副属性
	if (m1.types.length != m2.types.length) return false; //类型长度
	if (m1.types.some(function(t1,ti){
		return m2.types[ti] == undefined || m2.types[ti] != t1;
	})) return false; //全部类型有任意不同的时候也返回false
	if (m1.maxLevel != m2.maxLevel) return false; //最大等级
	if (m1.collabId != m2.collabId) return false; //合作ID
	return true;
}
/*
 * 正式流程
 */
officialAPI.forEach(function(lang) {
	console.log("正在读取官方 %s 信息",lang.code);
	const cardJson = fs.readFileSync("official-API/" + lang.code +"-card.json", 'utf-8'); //使用同步读取怪物
	const cardJsonObj = JSON.parse(cardJson);
	const oCards = lang.cardOriginal = cardJsonObj.card;//将字符串转换为json对象

	const monCards = lang.cards = [];
	for (let cardIndex = 0; oCards[cardIndex][0] === cardIndex; cardIndex++)
	{
		monCards.push(new Card(oCards[cardIndex]));
	}

	//加入自定义的语言
	lang.customName.forEach(function(lcode){
		console.log("正在读取自定义 " + lcode + " 信息");
		const ljson = fs.readFileSync("custom/" + lcode +".json", 'utf-8'); //使用同步读取
		const ccard = JSON.parse(ljson);//将字符串转换为json对象
		ccard.forEach(function(cm){ //每个文件内的名字循环
			let m = monCards[cm.id];
			if (m)
			{
				if (!m.otLangName) //如果没有其他语言名称属性，则添加一个对象属性
					m.otLangName = {};
				m.otLangName[lcode] = cm.name;
				if (!m.otTags) //如果没有其他语言名称属性，则添加一个对象属性
					m.otTags = [];
				
				let newTags = Array.from(new Set(cm.tags));
				newTags = newTags.filter(tag=>!m.altName.includes(tag) && !m.otTags.includes(tag));
				m.otTags.push(...newTags);
			}
		});
	});

	const skillJson = fs.readFileSync("official-API/" + lang.code +"-skill.json", 'utf-8'); //使用同步读取技能
	const skillJsonObj = JSON.parse(skillJson);
	const oSkills = lang.skillOriginal = skillJsonObj.skill;//将字符串转换为json对象
	lang.skills = oSkills.map((oc,idx)=>new Skill(idx,oc)); //每一项生成分析对象

	
	lang.cards.forEach((m,idx,arr)=>{
		const skill = lang.skills[m.activeSkillId];
		let henshinTo = null;
		const searchType = 202;
		if (skill.type == searchType)
			henshinTo = skill.params[0];
		else if (skill.type == 116 || skill.type == 118){
			const subskill = skill.params.map(id=>lang.skills[id]).find(subskill=>subskill.type == searchType);
			if (subskill)
				henshinTo = subskill.params[0];
		}
		if (henshinTo)
		{
			m.henshinTo = henshinTo;
			arr[henshinTo].henshinFrom = idx;
		}
	});
});

//加入其他服务器相同角色的名字
for (let li = 0;li < officialAPI.length; li++)
{
	const otherLangs = officialAPI.concat(); //复制一份原始数组，储存其他语言
	const lang = otherLangs.splice(li,1)[0]; //删掉并取得当前的语言

	const langCard = lang.cards;
	const langCardCount = langCard.length;
	for (let mi=0; mi<langCardCount; mi++)
	{
		const m = langCard[mi];
		const name = m.name; //当前语言的名字

		//名字对象
		otherLangs.forEach((otLang)=>{
			let _m = otLang.cards[mi]; //获得这种其他语言的当前这个怪物数据
			let isSame = sameCard(m,_m); //与原语言怪物是否是同一只
			const l1 = lang.code, l2 = otLang.code;
			if (!isSame && //如果不同时，判断特殊情况
				(
					l1 == 'ja' && (l2 == 'en' || l2 == 'ko') ||
					l2 == 'ja' && (l1 == 'en' || l1 == 'ko')
				)
			)
			{ //当同id两者不同，日服和英韩服比较时的一些人工确认相同的特殊id差异卡片
				const langIsJa = l1 == 'ja' ? true : false; //原始语言是否是日语
				let diff = 0; //日语和其它语言的id差异
				switch(true)
				{
					case (langIsJa && mi>=671 && mi<= 680) ||
						 (!langIsJa && mi>=1049 && mi<= 1058):
						//神罗 日服 671-680 等于英韩服 1049-1058
						diff = 378;
						break;
					case (langIsJa && mi>=669 && mi<= 670) ||
						 (!langIsJa && mi>=934 && mi<= 935):
						//神罗 日服 669-670 等于英韩服 934-935
						diff = 265;
						break;
					case (langIsJa && mi>=924 && mi<= 935) ||
						 (!langIsJa && mi>=669 && mi<= 680):
						//蝙蝠侠 日服 924-935 等于英韩服 669-680
						diff = -255;
						break;
					case (langIsJa && mi>=1049 && mi<= 1058) ||
						 (!langIsJa && mi>=924 && mi<= 933):
						//蝙蝠侠 日服 1049-1058 等于英韩服 924-933
						diff = -125;
						break;
				}
				if (diff != 0)
				{
					_m = langIsJa ? otLang.cards[mi + diff] : otLang.cards[mi - diff];
					isSame = true;
				}
			}
			if (_m && isSame) //如果有这个怪物，且与原语言怪物是同一只
			{
				const otName = _m.name;
				if (/^(?:\?+|\*+|초월\s*\?+)/i.test(otName)) //名字以问号、星号、韩文的问号开头
				{
					return; //跳过
				}else
				{
					if (!m.otLangName) //如果没有其他语言名称属性，则添加一个对象属性
						m.otLangName = {};

					m.otLangName[otLang.code] = otName;

					if (_m.otLangName)
					{ //增加储存当前语言的全部其他语言
						Object.entries(_m.otLangName).forEach(entry=>{
							const lcode = entry[0];
							if (lcode != l1 && !Object.keys(m.otLangName).includes(lcode)) //如果不是本来的的语言
								m.otLangName[lcode] = entry[1];
						});
					}
				}

				if (!m.otTags) //如果没有其他语言标签属性，则添加一个数组属性
					m.otTags = [];

				let otTags = Array.from(new Set(_m.otTags ? _m.altName.concat(_m.otTags) : _m.altName));
				otTags = otTags.filter(tag=>!m.altName.includes(tag) && !m.otTags.includes(tag));
				m.otTags.push(...otTags);
			}
		});
	}
}

var newCkeyObjs = officialAPI.map(lang=>{
	const lcode = lang.code;
	const cardStr = JSON.stringify(lang.cards);
	const skillStr = JSON.stringify(lang.skills);
	
	//写入Cards
	fs.writeFile(`./mon_${lcode}.json`,cardStr,function(err){
		if(err){
			console.error(err);
		}
		console.log(`mon_${lcode}.json 导出成功`);
	});
	//写入Skills
	fs.writeFile(`./skill_${lcode}.json`,skillStr,function(err){
		if(err){
			console.error(err);
		}
		console.log(`skill_${lcode}.json 导出成功`);
	});

	const cardHash = crypto.createHash('md5');
	const skillHash = crypto.createHash('md5');
	cardHash.update(cardStr, 'utf8');
	skillHash.update(skillStr, 'utf8');

	const ckeyOutObj = {
		code: lcode,
		ckey: {
			card: cardHash.digest('hex'),
			skill: skillHash.digest('hex'),
		},
		updateTime: runDate.getTime(),
	};
	return ckeyOutObj;
});
//读取旧的ckeyObj
var ckeyObjs;
fs.readFile('./ckey.json','utf-8',function(err,data){
	if(err)
	{ //如果读取错误，直接使用全新ckey
        ckeyObjs = newCkeyObjs;
    } else
	{ //如果读取正确，则读入JSON，并判断是否和旧有的一致
		ckeyObjs = JSON.parse(data);
		for (let ci=0;ci<ckeyObjs.length;ci++)
		{
			const oldCkey = ckeyObjs[ci];
			const newCkey = newCkeyObjs.find(nckey=>nckey.code === oldCkey.code);
			if (newCkey && (oldCkey.ckey.card != newCkey.ckey.card || oldCkey.ckey.skill != newCkey.ckey.skill))
			{
				ckeyObjs[ci] = newCkey;
			}
		}
    }
	fs.writeFile('./ckey.json',JSON.stringify(ckeyObjs),function(err){
		if(err){
			console.error(err);
		}
		console.log('ckey.json 导出成功');
	});
});

