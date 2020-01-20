﻿document.title = solo?'智龙迷城单人队伍图制作工具':'智龙迷城协力队伍图制作工具';

//查找原先完整技能
function findFullSkill(subSkill){
	let search = Skills.filter(ss=>{return (ss.type == 116 || ss.type == 118 || ss.type == 138) && ss.params.indexOf(subSkill.id)>=0;});
	if(search.length)
		{return [search[0],subSkill];}
	else
		{return subSkill;}
}
document.querySelector(".edit-box .row-mon-id .m-id").type = "number";
//Skills.filter(s=>{const sk = s.params; return s.type == 156;}).map(findFullSkill)

//高级技能解释
function parseSkillDescription(skill)
{
	const id = skill.id;
	if (id == 0) return "";
	const type = skill.type;
	const sk = skill.params;
	
	//珠子名和属性名数组
	const attrsName = ["火","水","木","光","暗","回复","废","毒","剧毒","炸弹"];
	//类型名数组
	const typeName = ["进化","平衡","体力","回复","龙","神","攻击","恶魔","机械","特别保护","10","11","觉醒","13","强化","卖钱"];
	//觉醒名数组
	const awokenName = ["HP+","攻击+","回复+","火盾","水盾","木盾","光盾","暗盾","自回","防封","防暗","防废","防毒","火+","水+","木+","光+","暗+","手指","心解","SB","火横","水横","木横","光横","暗横","U","SX","心+","协力","龙杀","神杀","恶魔杀","机杀","平衡杀","攻击杀","体力杀","回复杀","进化杀","觉醒杀","强化杀","卖钱杀","7c","5色破防","心追","全体 HP ","全体回复","破无效","武器觉醒","方块心追","5色溜","大防封","大手指","防云","防封条","大SB","满血强化","下半血强化","L盾","L解锁","10c","c珠","语音","奖励增加"," HP -","攻击-","回复-","大防暗","大防废","大防毒","掉废","掉毒"];
	const ClumsN = ["左边第1竖列","左边第2竖列","左边第3竖列","右边第3竖列","右边第2竖列","右边第1竖列"];
	const RowsN = ["最上1横行","上方第2横行","中间横行","下方第2横行","最下1横行"];
	//返回属性名
	function attrN(i){return attrsName[i || 0] || ("未知属性" + i);}
	//返回类型名
	function typeN(i){return typeName[i || 0] || ("未知类型" + i);}
	//返回觉醒名
	function awokenN(i){return awokenName[(i || 0)-1] || ("未知觉醒" + i);}
	//返回怪物名
	function cardN(id){
		let card = Cards[id || 0];
		if (!card)
		{
			return "没有该宠物 " + id;
		}else
		{
			const monOuterDom = document.createElement("span");
			monOuterDom.className = "detail-mon";
			const monDom = createCardA(id);
			monOuterDom.appendChild(monDom);
			changeid({id:id},monDom);
			return monOuterDom.outerHTML;
		}
	}
	//从二进制的数字中获得布尔值数组
	function getBooleanFromBinary(num,reverse=true)
	{	/*num是输入的数字，2的N次方在2进制下表示1后面跟着N个0。
		如果num和2的N次方同时存在某位1，则返回这个数，逻辑上转换为true。*/
		let arr = num.toString(2).split("").map(c=>{return parseInt(c);});
		if (reverse) arr.reverse();
		return arr;
	}
	//返回flag里值为true的数组，如[1,4,7]
	function flags(num){
		return Array.from(new Array(33)).map((a,i)=>{return i;}).filter(i => num & (1 << i));
	}
	//从二进制的数字中获得有哪些内容
	function getNamesFromBinary(num,dataArr)
	{	/*num是输入的数字，2的N次方在2进制下表示1后面跟着N个0。
		如果num和2的N次方同时存在某位1，则返回这个数，逻辑上转换为true。
		filter就可以返回所有有这个数的数据*/
		/*以珠子名称为例，num是输入的数字，比如10进制465转二进制=>111010001。
		二进制数从低位到高位表示火水木光暗……
		用逻辑运算AND序号来获得有没有这个值*/
		var results = dataArr.filter(function(pn,pi){
			return num & Math.pow(2,pi); //Math.pow(x,y)计算以x为底的y次方值
		});
		return results;
	}
	const nb = getNamesFromBinary; //化简名称

	function getAttrTypeString(attrsArray,typesArray)
	{
		let outArr = [];
		if (attrsArray.length)
		{
			outArr.push(attrsArray.map(attrN).join("、") + "属性");
		}
		if (typesArray.length)
		{
			outArr.push(typesArray.map(typeN).join("、") + "类型");
		}
		return outArr.join("和");
	}
	function stats(value, statTypes)
	{
		return [
			statTypes.indexOf(1) >= 0 ? value : 100, //攻击
			statTypes.indexOf(2) >= 0 ? value : 100  //回复
		];
	}
	const mulName = ["HP","攻击力","回复力"];
	//获取固定的三维成长的名称
	function getFixedHpAtkRcvString(values)
	{
		let mulArr = null;
		if (Array.isArray(values)) {
			mulArr = [
				1,
				values[0] / 100,
				values[1] / 100,
			];
		} else
		{
			mulArr = [
				(values.hp || 100) / 100,
				(values.atk || 100) / 100,
				(values.rcv || 100) / 100
			];
		}
		const hasMul = mulArr.filter(m=>{return m != 1;}); //不是1的数值
		let str = "";
		if (hasMul)
		{
			const hasDiff = hasMul.filter(m=>{return m != hasMul[0];}).length > 0; //存在不一样的值
			if (hasDiff)
			{
				str += mulArr.map((m,i)=>{
					return m!=1?`${mulName[i]}×${m}倍`:null;
				}).filter(s=>{return s!=null;}).join("，");
			}else
			{
				let hasMulName = mulName.filter((n,i)=>{return mulArr[i] != 1;});
				if (hasMulName.length>=3)
				{
					str+=hasMulName.slice(0,hasMulName.length-1).join("、") + "和" + hasMulName[hasMulName.length-1];
				}else
				{
					str+=hasMulName.join("和");
				}
				str += `×${hasMul[0]}倍`;
			}
		}else
		{
			str += "没有变化";
		}
		return str;
	}
	const mul = getFixedHpAtkRcvString;
	function getScaleAtkRcvString(ATK,RCV)
	{
		//{base,min,max,bonus}
		//if (tyof(HP) == "number")
	}

	let str = null;
	let strArr = null,fullColor = null,atSameTime = null,hasDiffOrbs = null;
	switch(type)
	{
		case 0:
			str = `对敌方全体造成自身攻击力×${sk[1]/100}倍的${attrN(sk[0])}属性伤害`;
			break;
		case 1:
			str = `对敌方全体造成${sk[1]}的${attrN(sk[0])}属性攻击`;
			break;
		case 2:
			str = `对敌方1体造成自身攻击力×${sk[0]/100}倍的伤害`;
			break;
		case 3:
			str = `${sk[0]}回合内受到的伤害减少${sk[1]}%`;
			break;
		case 4:
			str = `使敌方全体中毒，每回合损失宠物自身攻击力×${sk[0]/100}倍的 HP `;
			break;
		case 5:
			str = `${sk[0]}秒内时间停止，可以任意移动宝珠`;
			break;
		case 6:
			str = `敌人的 HP 减少${sk[0]}%`;
			break;
		case 7:
			str = `回复宠物自身回复力×${sk[0]/100}倍的 HP`;
			break;
		case 8:
			str = `回复${sk[0]} HP `;
			break;
		case 9:
			str = `${attrN(sk[0])}宝珠变为${attrN(sk[1])}宝珠`;
			break;
		case 10:
			str = `全版刷新`;
			break;
		case 11:
			str = `${attrN(sk[0])}属性宠物的攻击力×${sk[1]/100}倍`;
			break;
		case 12:
			str = `消除宝珠的回合，以自身攻击力×${sk[0]/100}倍的伤害追打敌人`;
			break;
		case 13:
			str = `消除宝珠的回合，回复自身回复力×${sk[0]/100}倍的 HP `;
			break;
		case 14:
			str = `如当前 HP 在 HP 上限的${sk[0]}%以上的话，受到单一次致命攻击时，${sk[1]<100?`有${sk[1]}的几率`:"将"}会以1点 HP 生还`;
			break;
		case 15:
			str = `操作时间演延长${sk[0]/100}秒`;
			break;
		case 16:
			str = `受到的所有伤害减少${sk[0]}%`;
			break;
		case 17:
			str = `受到的${attrN(sk[0])}属性伤害减少${sk[1]}%`;
			break;
		case 18:
			str = `将敌人的攻击延迟${sk[0]}回合`;
			break;
		case 19:
			str = `${sk[0]}回合内敌方防御力减少${sk[1]}%`;
			break;
		case 20: //单色A转B，C转D
			strArr = [];
			if (sk.length>=3 && sk.length<=4 && sk[1] == (sk[3]))
			{
				str = `${attrN(sk[0])}、${attrN(sk[2])}宝珠变为${attrN(sk[1])}`;
			}else
			{
				for (let ai=0;ai<sk.length;ai+=2)
				{
					strArr.push(`${attrN(sk[ai])}宝珠变为${attrN(sk[ai+1])}`);
				}
				str = strArr.join("，");
			}
			break;
		case 21:
			str = `${sk[0]}回合内${attrN(sk[1])}属性的伤害减少${sk[2]}%`;
			break;
		case 22: case 31:
			str = `${sk.slice(0,sk.length-1).map(t=>{return typeN(t);}).join("、")}类型宠物的攻击力×${sk[sk.length-1]/100}倍`;
			break;
		case 23: case 30:
			str = `${sk.slice(0,sk.length-1).map(t=>{return typeN(t);}).join("、")}类型宠物的 HP ×${sk[sk.length-1]/100}倍`;
			break;
		case 24:
			str = `${sk.slice(0,sk.length-1).map(t=>{return typeN(t);}).join("、")}类型宠物的回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 28:
			str = `${sk.slice(0,sk.length-1).map(t=>{return attrN(t);}).join("、")}属性宠物的攻击力和回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 29: case 114:
			str = `${sk.slice(0,sk.length-1).map(t=>{return attrN(t);}).join("、")}属性宠物的 HP、攻击力和回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 33:
			str = `宝珠移动和消除的声音变成太鼓达人的音效`;
			break;
		case 35:
			str = `对敌方1体造成自身攻击力×${sk[0]/100}倍的伤害，并回复${sk[1]}%的 HP`;
			break;
		case 36:
			str = `受到的${attrN(sk[0])}属性${sk[1]>=0?`和${attrN(sk[1])}属性`:""}的伤害减少${sk[2]}%`;
			break;
		case 37:
			str = `对敌方1体造成自身攻击力×${sk[1]/100}倍的${attrN(sk[0])}属性伤害`;
			break;
		case 38:
			str = `HP ${sk[0] == 100?"全满":`${sk[0]}%以下`}时${sk[1]<100?`有${sk[1]}的几率使`:""}受到的伤害减少${sk[2]}`;
			if (sk[1]!=100) str+=`未知的 参数1 ${sk[1]}`;
			break;
		case 39:
			strArr = [sk[1],sk[2]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `HP ${sk[0]==100?"全满":`${sk[0]}%以下`}时所有宠物的${strArr.join("和")}×${sk[3]/100}倍`;
			break;
		case 40:
			str = `${sk.slice(0,sk.length-1).map(t=>{return attrN(t);}).join("、")}属性宠物的攻击力×${sk[sk.length-1]/100}倍`;
			break;
		case 41:
			str = `受到敌人攻击时${sk[0]==100?"":`有${sk[0]}的几率`}进行受到伤害${sk[1]/100}倍的${attrN(sk[2])}属性反击`;
			break;
		case 42:
			str = `对${attrN(sk[0])}属性敌人造成${sk[2]}点${attrN(sk[1])}属性伤害`;
			break;
		case 43:
			str = `HP ${sk[0]==100 ?"全满":`${sk[0]}%以上`}时${sk[1]<100?`有${sk[1]}的几率使`:""}受到的伤害减少${sk[2]}`;
			break;
		case 44:
			strArr = [sk[1],sk[2]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `HP ${sk[0]==100?"全满":`${sk[0]}%以上`}时所有宠物的${strArr.join("和")}×${sk[3]/100}倍`;
			break;
		case 45: case 111:
			str = `${sk.slice(0,sk.length-1).map(t=>{return attrN(t);}).join("、")}属性宠物的 HP 和攻击力×${sk[sk.length-1]/100}倍`;
			break;
		case 46:case 48:
			str = `${sk.slice(0,sk.length-1).map(t=>{return attrN(t);}).join("、")}属性宠物的 HP ${sk[sk.length-1]/100}倍`;
			break;
		case 49:
			str = `${sk.slice(0,sk.length-1).map(t=>{return attrN(t);}).join("、")}属性宠物的回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 50:
			str = `${sk[0]}回合内${(sk[1]==5?"回复力":`${attrN(sk[1])}属性的攻击力`)}×${sk[2]/100}倍`;
			break;
		case 51:
			str = `${sk[0]}回合内，所有攻击转为全体攻击`;
			break;
		case 52:
			str = `${attrN(sk[0])}宝珠强化（每颗强化珠伤害/回复增加${sk[1]}%）`;
			break;
		case 54:
			str = `进入地下城时为队长的话，获得的金币${sk[0]/100}倍`;
			break;
		case 55:
			str = `对敌方1体造成${sk[0]}点无视防御的固定伤害`;
			break;
		case 56:
			str = `对敌方全体造成${sk[0]}点无视防御的固定伤害`;
			break;
		case 58:
			str = `对敌方全体造成自身攻击力×${sk[1]/100}~${sk[2]/100}倍的${attrN(sk[0])}属性伤害`;
			break;
		case 59:
			str = `对敌方1体造成自身攻击力×${sk[1]/100}~${sk[2]/100}倍的${attrN(sk[0])}属性伤害`;
			break;
		case 60:
			str = `${sk[0]}回合内，受到伤害时进行受到伤害${sk[1]/100+"倍的"+attrN(sk[2])}属性反击`;
			break;
		case 61:
			fullColor = nb(sk[0], attrsName);
			atSameTime = fullColor.length == sk[1];
			if (sk[0] == 31) //31-11111
			{ //单纯5色
				str = '';
			}else if((sk[0] & 31) == 31)
			{ //5色加其他色
				str = `5色+${nb(sk[0] ^ 31, attrsName).join("、")}`;
				if (!atSameTime) str+="中";
			}else
			{
				str = `${fullColor.join("、")}`;
				if (!atSameTime) str+="中";
			}
			if (!atSameTime) str+=`${sk[1]}种属性以上`;
			else if(sk[0] == 31) str += `5色`;
			str += `同时攻击时，所有宠物的攻击力×${sk[2]/100}倍`;
			if (sk[3])
			{str += `，每多一种属性+${sk[3]/100}倍，最大${fullColor.length}种时${(sk[2]+sk[3]*(fullColor.length-sk[1]))/100}倍`;}
			break;
		case 62: case 77:
			str = `${sk.slice(0,sk.length-1).map(t=>{return typeN(t);}).join("、")}类型宠物的 HP 和攻击力×${sk[sk.length-1]/100}倍`;
			break;
		case 63:
			str = `${sk.slice(0,sk.length-1).map(t=>{return typeN(t);}).join("、")}类型宠物的 HP 和回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 64: case 79:
			str = `${sk.slice(0,sk.length-1).map(t=>{return typeN(t);}).join("、")}类型宠物的攻击力和回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 65:
			str = `${sk.slice(0,sk.length-1).map(t=>{return typeN(t);}).join("、")}类型宠物的 HP、攻击力和回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 66:
			str = `${sk[0]}连击以上所有宠物的攻击力${sk[1]/100}倍`;
			break;
		case 67:
			str = `${sk.slice(0,sk.length-1).map(t=>{return attrN(t);}).join("、")}属性宠物的 HP 和回复力×${sk[sk.length-1]/100}倍`;
			break;
		case 69:
			str = `${attrN(sk[0])}属性和${typeN(sk[1])}类型宠物的攻击力×${sk[2]/100}倍`;
			break;
		case 71:
			//这个类型，所有颜色是直接显示的，但是最后一位有个-1表示结束
			strArr = sk;
			if (sk.indexOf(-1)>=0)
			{
				strArr = sk.slice(0,sk.indexOf(-1));
			}
			str = "全画面的宝珠变成" + strArr.map((o)=>{return attrN(o);}).join("、");
			break;
		case 73:
			str = `${attrN(sk[0])}属性和${typeN(sk[1])}类型宠物的 HP 和攻击力×${sk[2]/100}倍`;
			break;
		case 75:
			str = `${attrN(sk[0])}属性和${typeN(sk[1])}类型宠物的攻击力和回复力×${sk[2]/100}倍`;
			break;
		case 76:
			strArr = [];
			if (sk[0] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[0]) {strArr.push(nb(sk[0],attrsName).join("、") + "属性");}
				if (sk[1]) {strArr.push(nb(sk[1],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			str += ` HP 、攻击力和回复力${sk[2]/100}倍`;
			break;
		case 84:
			str = `HP ${(sk[3]?(`减少${sk[3]}%`):"变为1")}，对敌方1体造成自身攻击力×${sk[1]/100}${sk[1]!=sk[2]?`~${+sk[2]/100}`:""}倍的${attrN(sk[0])}属性伤害`;
			break;
		case 85:
			str = `HP 减少${sk[3]}%，对敌方全体造成自身攻击力×${sk[1]/100}${sk[1]!=sk[2]?`~${+sk[2]/100}`:""}倍的${attrN(sk[0])}属性伤害`;
			break;
		case 86:
			str = `HP 变为1，，对敌方1体造成${sk[1]}点${attrN(sk[0])}属性伤害`;
			break;
		case 87:
			str = `HP 变为1，，对敌方全体造成${sk[1]}点${attrN(sk[0])}属性伤害`;
			break;
		case 88:
			str = `${sk[0]}回合内${typeN(sk[1])}类型的攻击力×${sk[2]/100}倍`;
			break;
		case 90:
			strArr = sk.slice(1,sk.length-1);
			str = `${sk[0]}回合内${strArr.map(attrN).join("、")}属性的攻击力×${sk[sk.length-1]/100}倍`;
			break;
		case 91:
			str = `${sk.slice(0,sk.length-1).map(attrN).join("、")}属性宝珠强化`;
			if (sk[sk.length-1] != 6) str += `未知 参数${sk.length-1} ${sk[sk.length-1]}`;
			break;
		case 92:
			strArr = sk.slice(1,sk.length-1);
			str = `${sk[0]}回合内${strArr.map(typeN).join("、")}类型的攻击力×${sk[sk.length-1]/100}倍`;
			break;
		case 93:
			str = `将自己换成队长，再次使用此技能则换为原来的队长。`;
			if (sk[0]) str += `未知 参数0 ${sk[0]}`;
			break;
		case 94:
			strArr = [sk[2],sk[3]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `HP ${sk[0]==100?"全满":`${sk[0]}%以下`}时${attrN(sk[1])}属性宠物的${strArr.join("和")}×${sk[4]/100}倍`;
			break;
		case 95:
			strArr = [sk[2],sk[3]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `HP ${sk[0]==100?"全满":`${sk[0]}%以下`}时${typeN(sk[1])}类型宠物的${strArr.join("和")}×${sk[4]/100}倍`;
			break;
		case 96:
			strArr = [sk[2],sk[3]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `HP ${sk[0]==100?"全满":`${sk[0]}%以上`}时${attrN(sk[1])}属性宠物的${strArr.join("和")}×${sk[4]/100}倍`;
			break;
		case 97:
			strArr = [sk[2],sk[3]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `HP ${sk[0]==100?"全满":`${sk[0]}%以上`}时${typeN(sk[1])}类型宠物的${strArr.join("和")}×${sk[4]/100}倍`;
			break;
		case 98:
			str = `${sk[0]}连击时，所有宠物的攻击力${sk[1]/100}倍，每多1连击+${sk[2]/100}倍，最大${sk[3]}连击时${(sk[1]+sk[2]*(sk[3]-sk[0]))/100}倍`;
			break;
		case 100:
			strArr = [sk[0],sk[1]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `使用技能时，所有宠物的${strArr.join("和")}×${sk[2]/100}倍`;
			break;
		case 103:
			strArr = [sk[1],sk[2]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `${sk[0]}连击或以上时所有宠物的${strArr.join("和")}×${sk[3]/100}倍`;
			break;
		case 104:
			strArr = [sk[2],sk[3]].filter(s=>{return s>0;}).map(s=>{if(s==1) return "攻击力"; else if(s==2) return "回复力";});
			str = `${sk[0]}连击以上时时${nb(sk[1],attrsName).join("、")}属性宠物的${strArr.join("和")}×${sk[4]/100}倍`;
			break;
		case 108:
			str = `HP 变为${sk[0]}%，${typeN(sk[1])}类型宠物的攻击力×${sk[2]/100}倍`;
			break;
		case 110:
			str = `根据余下 HP 对敌方${sk[0]?"1":"全"}体造成${attrN(sk[1])}属性伤害（100% HP 时为自身攻击力×${sk[2]/100}倍，1 HP 时为自身攻击力×${sk[3]/100}倍）`;
			break;
		case 115:
			str = `对敌方1体造成自身攻击力×${sk[1]/100}倍的${attrN(sk[0])}属性伤害，并回复伤害${sk[2]}%的 HP `;
			break;
		case 116: //多内容主动技能，按顺序组合发动如下主动技能：
			str = `<ul class="active-skill-ul">`;
			//处理多次单人固伤
			let repeatDamage = sk.filter(subSkill => {return Skills[subSkill].type == 188;});
			if (repeatDamage.length>1)
			{
				strArr = sk.filter(subSkill => {return Skills[subSkill].type != 188;}).map(subSkill => {return `<li class="active-skill-li">${parseSkillDescription(Skills[subSkill])}</li>`;});
				strArr.splice(sk.indexOf(repeatDamage[0]),0,`<li class="active-skill-li">${parseSkillDescription(Skills[repeatDamage[0]])}×${repeatDamage.length}次</li>`);
				str += strArr.join("");
			}else
			{
				str += sk.map(subSkill => {return `<li class="active-skill-li">${parseSkillDescription(Skills[subSkill])}</li>`;}).join("");
			}
			str += `</ul>`;
			break;
		case 118: //随机内容主动技能
			str = `随机发动以下技能：<ul class="active-skill-ul random-active-skill">`;
			str += sk.map(subSkill => {return `<li class="active-skill-li">${parseSkillDescription(Skills[subSkill])}</li>`;}).join("");
			str += `</ul>`;
			break;
		case 117:
			strArr = [];
			if(sk[1]>0) strArr.push(`回复宠物自身回复力x${sk[1]/100}倍的 HP `);
			if(sk[3]) strArr.push(`回复 HP 上限${sk[3]}%的 HP `);
			if(sk[2]) strArr.push(`回复${sk[2]} HP `);
			if(sk[0]>0) strArr.push(`封锁状态减少${sk[0]}回合`);
			if(sk[4]>0) strArr.push(`觉醒无效状态减少${sk[4]}回合`);
			str = strArr.join("，");
			break;
		case 119: //相連消除4個的水寶珠時，所有寵物的攻擊力2.5倍，每多1個+0.5倍，最大5個時3倍
			str = `相连消除${sk[1]}个或以上${nb(sk[0],attrsName).join("或")}宝珠时，所有宠物的攻击力${sk[2]/100}倍`;
			if (sk[3]>0)
			{
				str += `，每多1个+${sk[3]/100}倍`;
			}
			if (sk[4]>0)
			{
				str += `，最大${sk[4]}个时${(sk[2]+sk[3]*(sk[4]-sk[1]))/100}倍`;
			}
			break;
		case 121:
			str = ``;
			strArr =[];
			if (sk[0] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[0]) {strArr.push(nb(sk[0],attrsName).join("、") + "属性");}
				if (sk[1]) {strArr.push(nb(sk[1],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[2]) {strArr.push(`HP×${sk[2]/100}倍`);}
			if (sk[3]) {strArr.push(`攻击力×${sk[3]/100}倍`);}
			if (sk[4]) {strArr.push(`回复力×${sk[4]/100}倍`);}
			str += strArr.join("、");
			break;
		case 122:
			str = `HP ${sk[0]}%以下时`;
			strArr =[];
			if (sk[1] & 31 != 31)
			{
				if (sk[1]) {strArr.push(nb(sk[1],attrsName).join("、") + "属性");}
				if (sk[2]) {strArr.push(nb(sk[2],typeName).join("、") + "类型");}
			}else
			{
				strArr.push("所有");
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[3]) {strArr.push(`攻击力×${sk[3]/100}倍`);}
			if (sk[4]) {strArr.push(`回复力×${sk[4]/100}倍`);}
			str += strArr.join("、");
			break;
		case 123:
			str = `HP ${sk[0]}%以上时`;
			strArr =[];
			if (sk[1] & 31 != 31)
			{
				if (sk[1]) {strArr.push(nb(sk[1],attrsName).join("、") + "属性");}
				if (sk[2]) {strArr.push(nb(sk[2],typeName).join("、") + "类型");}
			}else
			{
				strArr.push("所有");
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[3]) {strArr.push(`攻击力×${sk[3]/100}倍`);}
			if (sk[4]) {strArr.push(`回复力×${sk[4]/100}倍`);}
			str += strArr.join("、");
			break;
		case 124:
			strArr = sk.slice(0,5).filter(c=>{return c>0;}); //最多5串珠
			hasDiffOrbs = strArr.filter(s=>{return s!= strArr[0];}).length > 0; //是否存在不同色的珠子
			if (sk[5] < strArr.length) //有阶梯的
			{
				if (hasDiffOrbs)
				{//「光光火/光火火」組合的3COMBO時，所有寵物的攻擊力3.5倍；「光光火火」組合的4COMBO或以上時，所有寵物的攻擊力6倍 
					str = `${strArr.map(a=>{return nb(a, attrsName);}).join("、")}中${sk[5]}串同时攻击时，所有宠物的攻击力×${sk[6]/100}倍，每多1串+${sk[7]/100}倍，最大${strArr.length}串时×${(sk[6]+sk[7]*(strArr.length-sk[5]))/100}倍`;
				}else
				{//木寶珠有2COMBO時，所有寵物的攻擊力3倍，每多1COMBO+4倍，最大5COMBO時15倍 
					str = `${nb(strArr[0], attrsName).join("、")}宝珠有${strArr.length}串时，所有宠物的攻击力×${sk[6]/100}倍，每多1串+${sk[7]/100}倍，最大${strArr.length}串时×${(sk[6]+sk[7]*(strArr.length-sk[5]))/100}倍`;
				}
			}else
			{
				if (hasDiffOrbs)
				{//火光同時攻擊時，所有寵物的攻擊力2倍
					str = `${strArr.map(a=>{return nb(a, attrsName);}).join("、")}同时攻击时，所有宠物的攻击力×${sk[6]/100}倍`;
				}else
				{//光寶珠有2COMBO或以上時，所有寵物的攻擊力3倍
					str = `${nb(strArr[0], attrsName).join("、")}宝珠有${strArr.length}串或以上时，所有宠物的攻击力×${sk[6]/100}倍`;
				}
			}
			break;
		case 125: //隊伍中同時存在 時，所有寵物的攻擊力3.5倍
			strArr = sk.slice(0,5).filter(s=>{return s>=0;});
			str = `队伍中${strArr.length>1?"同时":""}存在`;
			str += strArr.map(cardN).join("");
			str += "时所有宠物的";
			strArr =[];
			if (sk[5]) {strArr.push(`HP×${sk[5]/100}倍`);}
			if (sk[6]) {strArr.push(`攻击力×${sk[6]/100}倍`);}
			if (sk[7]) {strArr.push(`回复力×${sk[7]/100}倍`);}
			str += strArr.join("、");
			break;
		case 126:
			str = `${sk[1]}${sk[1] != sk[2]?`~${sk[2]}`:""}回合内${nb(sk[0], attrsName).join("、")}珠的掉落率提高${sk[3]}%`;
			break;
		case 127: //生成竖列
			strArr = [];
			for (let ai=0;ai<sk.length;ai+=2)
			{
				strArr.push(`${nb(sk[ai],ClumsN).join("、")}的宝珠变为${nb(sk[ai+1],attrsName).join("、")}`);
			}
			str = strArr.join("，");
			break;
		case 128: //生成横
			strArr = [];
			for (let ai=0;ai<sk.length;ai+=2)
			{
				strArr.push(`${nb(sk[ai],RowsN).join("、")}的宝珠变为${nb(sk[ai+1],attrsName).join("、")}`);
			}
			str = strArr.join("，");
			break;
		case 129:
			str = ``;
			strArr =[];
			if (sk[0] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[0]) {strArr.push(nb(sk[0],attrsName).join("、") + "属性");}
				if (sk[1]) {strArr.push(nb(sk[1],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";

			let hasArr = [sk[2],sk[3],sk[4]].filter(s=>{return s>0;}); //储存会增加的
			let hasDiffScale = hasArr.filter(s=>{return s!=hasArr[0];}).length > 0; //判断是否有重复的
			strArr = [];
			if (hasDiffScale) //如果大家的值不一样，则不合并
			{
				if (sk[2]) {strArr.push(` HP ×${sk[2]/100}倍`);}
				if (sk[3]) {strArr.push(`攻击力×${sk[3]/100}倍`);}
				if (sk[4]) {strArr.push(`回复力×${sk[4]/100}倍`);}
				str += strArr.join("、");
			}else  //如果大家的值一样，则合并
			{
				if (sk[2]) {strArr.push(` HP `);}
				if (sk[3]) {strArr.push(`攻击力`);}
				if (sk[4]) {strArr.push(`回复力`);}
				if (strArr.length)
				{
					if (strArr.length <= 2)
					{
						str += strArr.join("和") + `×${hasArr[0]/100}倍`;
					}else
					{
						str += strArr.slice(0,strArr.length-1).join("、") + `和${strArr[strArr.length-1]}×${hasArr[0]/100}倍`;
					}
				}
			}
			if (sk[5]) {
				if (strArr.length)str += "，";
				str += `受到的${nb(sk[5],attrsName).join("、")}属性伤害减少${sk[6]}%`;
			}
			break;
		case 130:
			str = `HP ${sk[0]}%以下时`;
			strArr =[];
			if (sk[1] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[1]) {strArr.push(nb(sk[1],attrsName).join("、") + "属性");}
				if (sk[2]) {strArr.push(nb(sk[2],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[3]) {strArr.push(`攻击力×${sk[3]/100}倍`);}
			if (sk[4]) {strArr.push(`回复力×${sk[4]/100}倍`);}
			str += strArr.join("、");
			if (sk[5]) {
				if (strArr.length)str += "，";
				str += `受到的${nb(sk[5],attrsName).join("、")}属性伤害减少${sk[6]}%`;
			}
			break;
		case 131:
			str = `HP ${sk[0]}%以上时`;
			strArr =[];
			if (sk[1] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[1]) {strArr.push(nb(sk[1],attrsName).join("、") + "属性");}
				if (sk[2]) {strArr.push(nb(sk[2],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[3]) {strArr.push(`攻击力×${sk[3]/100}倍`);}
			if (sk[4]) {strArr.push(`回复力×${sk[4]/100}倍`);}
			str += strArr.join("、");
			if (sk[5]) {
				if (strArr.length)str += "，";
				str += `受到的${nb(sk[5],attrsName).join("、")}属性伤害减少${sk[6]}%`;
			}
			break;
		case 132:
			str = `${sk[0]}回合内，宝珠移动时间${sk[1]?`增加${sk[1]/10}秒`:""}${sk[2]?`变为${sk[2]/100}倍`:""}`;
			break;
		case 133:
			str = `使用技能时，`;
			strArr =[];
			if (sk[0] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[0]) {strArr.push(nb(sk[0],attrsName).join("、") + "属性");}
				if (sk[1]) {strArr.push(nb(sk[1],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[2]) {strArr.push(`攻击力×${sk[2]/100}倍`);}
			if (sk[3]) {strArr.push(`回复力×${sk[3]/100}倍`);}
			str += strArr.join("、");
			break;
		case 138: //多内容队长技能，按顺序组合发动如下队长技能：
			str = `<ul class="leader-skill-ul">`;
			str += sk.map(subSkill => {return `<li class="leader-skill-li">${parseSkillDescription(Skills[subSkill])}</li>`;}).join("");
			str += `</ul>`;
			break;
		case 139:
			str = ``;
			strArr =[];
			if (sk[0] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[0]) {strArr.push(nb(sk[0],attrsName).join("、") + "属性");}
				if (sk[1]) {strArr.push(nb(sk[1],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			str += ` HP ${sk[2]==(sk[3]||100)?(sk[2]==100?"全满":`${sk[2]}%`):(sk[3]==0?`${sk[2]}%以上`:`${sk[2]}%~${sk[3]}%`)}时攻击力${sk[4]/100}倍`;
			str += `，HP ${sk[5]==(sk[6]||sk[5])?(sk[5]==100?"全满":`${sk[6]}%`):(sk[6]<=1?`${sk[5]}%以下`:`${sk[5]}%~${sk[6]}%`)}时攻击力${sk[7]/100}倍`;
			break;
		case 140:
			str = `${nb(sk[0],attrsName).join("、")}宝珠强化（每颗强化珠伤害/回复增加${sk[1]}%）`;
			break;
		case 141:
			let otherAttrs = sk[1] ^ sk[2]; //异或，sk[2]表示在什么珠以外生成，平时等于sk[1]
			str = `${otherAttrs?`${nb(otherAttrs,attrsName).join("、")}以外`:""}随机生成${nb(sk[1],attrsName).join("、")}珠各${sk[0]}个`;
			break;
		case 142:
			str = `${sk[0]}回合内自身的属性变为${attrN(sk[1])}`;
			break;
		case 144:
			str = `对敌方${sk[2]?sk[2]:"全"}体造成${nb(sk[0],attrsName).join("、")}属性总攻击力×${sk[1]/100}倍的${attrN(sk[3])}属性伤害`;
			break;
		case 146:
			str = `自身以外的宠物技能冷却减少${sk[0]}${sk[0]!=sk[1]?`~${sk[1]}`:""}回合`;
			break;
		case 148:
			str = `进入地下城时为队长的话，获得的经验${sk[0]/100}倍`;
			break;
		case 150: //相連消除5粒寶珠，而當中包含至少1粒強化寶珠時，該屬性的攻擊力1.5倍
			str = `相连消除5粒宝珠，而当中包含至少1粒强化宝珠时，该属性的攻击力${sk[1]/100}倍`;
			if (sk[0]) str += `未知的 参数0 ${sk[0]}`;
			break;
		case 151:
			str = `以十字形式消除5个${attrN(5)}宝珠时`;
			strArr = [];
			if (sk[0]) strArr.push(`攻击力×${sk[0]/100}倍`);
			if (sk[1]) strArr.push(`回复力×${sk[1]/100}倍`);
			if (strArr.length) str += `，所有宠物的${strArr.join("，")}`;
			if (sk[3]) str += `，受到的伤害减少${sk[3]}%`;
			break;
		case 152:
			str = `将`;
			if (sk[0] & 1023 == 1023) //parseInt("1111111111",2) == 1023
			{
				str += `全部`;
			}else if (sk[0] & 31 == 31) //parseInt("11111",2) == 31
			{
				str += `5色+${nb(sk[0] ^ 31,attrsName).join("、")}`;
			}else
			{
				str += nb(sk[0],attrsName).join("、");
			}
			str += `宝珠锁定`;
			if (sk[1]!=42 && sk[1]!=99) str += `，还有未知 参数[1]：${sk[1]}`;
			break;
		case 153:
			str = `敌人全体变为${attrN(sk[0])}属性。（${sk[1]?"不":""}受防护盾的影响）`;
			break;
		case 154:
			str = `${nb(sk[0],attrsName).join("、")}珠变为${nb(sk[1],attrsName).join("、")}`;
			break;
		case 156: //宝石姬技能
			strArr = sk.slice(1,4);
			str = `${sk[0]?`${sk[0]}回合内，`:""}根据队伍内觉醒技能${strArr.filter(s=>{return s>0;}).map(s=>{return awokenN(sk[1]);}).join("、")}的数目`;
			if (sk[4]==1)
				str += `回复 HP ，每个觉醒回复${sk[5]}点`;
			else if (sk[4]==2)
				str += `提升所有属性的攻击力，每个觉醒可以提升${sk[5]-100}%`;
			else if (sk[4]==3)
				str += `减少收到的伤害，每个觉醒可以减少${sk[5]}%`;
			else
				str = `156宝石姬技能，未知buff类型 参数[4]：${sk[4]}`;
			break;
		case 157:
			str = `以十字形式消除5个${attrN(sk[0])}宝珠，当消除N个十字时，所有宠物的攻击力×${sk[1]/100}<sup>N</sup>倍`;
			break;
		case 160:
			str = `${sk[0]}回合内，结算时增加${sk[1]}COMBO`;
			break;
		case 164:
			fullColor = sk.slice(0,4).filter(c=>{return c>0;}); //最多4串珠
			hasDiffOrbs = fullColor.filter(s=>{return s!= fullColor[0];}).length > 0; //是否存在不同色的珠子
			strArr = [];
			if (sk[4] < fullColor.length) //有阶梯的
			{
				if (hasDiffOrbs)
				{//「光光火/光火火」組合的3COMBO時，所有寵物的攻擊力3.5倍；「光光火火」組合的4COMBO或以上時，所有寵物的攻擊力6倍 
					str = `${fullColor.map(a=>{return nb(a, attrsName);}).join("、")}中${sk[4]}串同时攻击时，所有宠物的攻击力和回复力×${sk[5]/100}倍，每多1串+${sk[7]/100}倍，最大${fullColor.length}串时×${(sk[6]+sk[7]*(fullColor.length-sk[4]))/100}倍`;
				}else
				{//木寶珠有2COMBO時，所有寵物的攻擊力3倍，每多1COMBO+4倍，最大5COMBO時15倍 
					str = `${nb(fullColor[0], attrsName).join("、")}宝珠有${fullColor.length}串时，所有宠物的攻击力和回复力×${sk[6]/100}倍，每多1串+${sk[7]/100}倍，最大${fullColor.length}串时×${(sk[6]+sk[7]*(fullColor.length-sk[5]))/100}倍`;
				}
				if (sk[5]) strArr.push(`攻击力×${sk[5]/100}倍，每多1串+${sk[7]/100}倍，最大${fullColor.length}串时×${(sk[5]+sk[7]*(fullColor.length-sk[4]))/100}倍`);
				if (sk[6]) strArr.push(`回复力×${sk[6]/100}倍，每多1串+${sk[7]/100}倍，最大${fullColor.length}串时×${(sk[6]+sk[7]*(fullColor.length-sk[4]))/100}倍`);
				str += strArr.join("、");
			}else
			{
				if (hasDiffOrbs)
				{//木暗同時攻擊時，所有寵物的攻擊力和回復力2倍
					str = `${fullColor.map(a=>{return nb(a, attrsName);}).join("、")}同时攻击时，所有宠物的`;
				}else
				{//光寶珠有2COMBO或以上時，所有寵物的攻擊力3倍
					str = `${nb(fullColor[0], attrsName).join("、")}宝珠有${fullColor.length}串或以上时，所有宠物的`;
				}
				if (sk[5]) strArr.push(`攻击力×${sk[5]/100}倍`);
				if (sk[6]) strArr.push(`回复力×${sk[6]/100}倍`);
				str += strArr.join("、");
			}
			break;
		case 165:
			fullColor = nb(sk[0], attrsName);
			atSameTime = fullColor.length == sk[1];
			if (sk[0] == 31) //31-11111
			{ //单纯5色
				str = '';
			}else if((sk[0] & 31) == 31)
			{ //5色加其他色
				str = `5色+${nb(sk[0] ^ 31, attrsName).join("、")}`;
				if (!atSameTime) str+="中";
			}else
			{
				str = `${fullColor.join("、")}`;
				if (!atSameTime) str+="中";
			}
			if (!atSameTime) str+=`${sk[1]}种属性以上`;
			else if(sk[0] == 31) str += `5色`;
			str += `同时攻击时，所有宠物的`;
			strArr = [];
			if (sk[2]==sk[3] && sk[4] == sk[5])
			{
				strArr.push(`攻击力和回复力×${sk[2]/100}倍`);
				if (sk[4]>0)
				{
					strArr.push(`每多1种属性+${sk[4]/100}倍`);
				}
				if (sk[6]>0)
				{
					strArr.push(`最大${sk[6]}种属性时×${((sk[6]-sk[1])*sk[4]+sk[2])/100}倍`);
				}
			}else
			{
				if (sk[2]>0)
				{
					strArr.push(`攻击力×${sk[2]/100}倍`);
					if (sk[4]>0)
					{
						strArr.push(`每多1种属性+${sk[4]/100}倍`);
					}
					if (sk[6]>0)
					{
						strArr.push(`最大${sk[6]}种属性时×${((sk[6]-sk[1])*sk[4]+sk[2])/100}倍`);
					}
				}
				if (sk[3]>0)
				{
					strArr.push(`回复力×${sk[3]/100}倍`);
					if (sk[5]>0)
					{
						strArr.push(`每多1种属性+${sk[5]/100}倍`);
					}
					if (sk[6]>0)
					{
						strArr.push(`最大${sk[6]}种属性时×${((sk[6]-sk[1])*sk[5]+sk[3])/100}倍`);
					}
				}
			}
			str += strArr.join("，");
			break;
		case 167:
			//"相連消除5個或以上的火寶珠或光寶珠時攻擊力和回復力4倍，每多1個+1倍，最大7個時6倍；"
			str = `相连消除${sk[1]}个或以上${nb(sk[0],attrsName).join("或")}宝珠时，所有宠物的`;
			strArr = [];
			if (sk[2]==sk[3] && sk[4] == sk[5])
			{
				strArr.push(`攻击力和回复力×${sk[2]/100}倍`);
				if (sk[4]>0)
				{
					strArr.push(`每多1个+${sk[4]/100}倍`);
				}
				if (sk[6]>0)
				{
					strArr.push(`最大${sk[6]}个时×${((sk[6]-sk[1])*sk[4]+sk[2])/100}倍`);
				}
			}else
			{
				if (sk[2]>0)
				{
					strArr.push(`攻击力×${sk[2]/100}倍`);
					if (sk[4]>0)
					{
						strArr.push(`每多1个+${sk[4]/100}倍`);
					}
					if (sk[6]>0)
					{
						strArr.push(`最大${sk[6]}个时×${((sk[6]-sk[1])*sk[4]+sk[2])/100}倍`);
					}
				}
				if (sk[3]>0)
				{
					strArr.push(`回复力×${sk[3]/100}倍`);
					if (sk[5]>0)
					{
						strArr.push(`每多1个+${sk[5]/100}倍`);
					}
					if (sk[6]>0)
					{
						strArr.push(`最大${sk[6]}个时×${((sk[6]-sk[1])*sk[5]+sk[3])/100}倍`);
					}
				}
			}
			str += strArr.join("，");
			break;
		case 168: //宝石姬技能2
			strArr = sk.slice(1,7); //目前只有2个，而且2-6都是0，不知道是不是真的都是觉醒
			str = `${sk[0]?`${sk[0]}回合内，`:""}根据队伍内觉醒技能${strArr.filter(s=>{return s>0;}).map(s=>{return awokenN(sk[1]);}).join("、")}的数目`;
			str += `提升所有属性的攻击力，每个觉醒可以提升${sk[7]}%`;
			break;
		case 169: //5COMBO或以上時受到的傷害減少25%、攻擊力6倍；
			str = `${sk[0]}连击或以上时，所有宠物的攻击力×${sk[1]/100}倍，受到的伤害减少${sk[2]}%`;
			break;
		case 172:
			str = `解锁所有宝珠`;
			break;
		case 176:
		//●◉○◍◯
			var table = [sk[0],sk[1],sk[2],sk[3],sk[4]];
			str = `以如下形状生成${attrN(sk[5])}宝珠<br>`;
			str += table.map(r=>{
				const orbs = flags(r);
				const line = Array.from(new Array(6)).map((a,i)=>{return orbs.indexOf(i)>=0?"●":"○";});
				return line.join("");
			}).join("<br>");
			break;
		case 173:
			strArr = [];
			if (sk[1]) strArr.push("属性吸收");
			if (sk[2]) strArr.push("连击吸收？目前是猜测");
			if (sk[3]) strArr.push("伤害吸收");
			str = `${sk[0]}回合内敌人的${strArr.join("、")}无效化`;
			break;
		case 184:
			str = `${sk[0]}回合内，天降的宝珠不会产生COMBO`;
			break;
		case 180:
			str = `${sk[0]}回合内，${sk[1]}%概率掉落强化宝珠`;
			break;
		case 185: //ドラゴンと悪魔タイプの攻撃力が4倍、回復力は2.5倍。\nドロップ操作を3秒延長。
			str = ``;
			strArr =[];
			if (sk[1] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[1]) {strArr.push(nb(sk[1],attrsName).join("、") + "属性");}
				if (sk[2]) {strArr.push(nb(sk[2],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[3]) {strArr.push(`HP ${sk[3]/100}倍`);}
			if (sk[4]) {strArr.push(`攻击力 ${sk[4]/100}倍`);}
			if (sk[5]) {strArr.push(`回复力 ${sk[5]/100}倍`);}
			str += strArr.join("、");
			if (sk[0]) str += `，操作时间演延长${sk[0]/100}秒`;
			break;
		case 186:
			str = '<span class="spColor">版面变为【7×6】</span>';
			strArr =[];
			if (sk[0] & 31 == 31)
			{
				strArr.push("所有");
			}else
			{
				if (sk[0]) {strArr.push(nb(sk[0],attrsName).join("、") + "属性");}
				if (sk[1]) {strArr.push(nb(sk[1],typeName).join("、") + "类型");}
			}
			str += strArr.join("和") + "宠物的";
			strArr =[];
			if (sk[2]) {strArr.push(`HP×${sk[2]/100}倍`);}
			if (sk[3]) {strArr.push(`攻击力×${sk[3]/100}倍`);}
			if (sk[4]) {strArr.push(`回复力×${sk[4]/100}倍`);}
			str += strArr.join("、");
			break;
		case 188:
			str = `对敌方1体造成${sk[0]}点无视防御的固定伤害`;
			break;
		case 191:
			str = `${sk[0]}回合内可以贯穿伤害无效盾`;
			break;
		case 192:
			//相連消除9個或以上的火寶珠時攻擊力4倍、結算增加2COMBO
			//同時消除光寶珠和水寶珠各4個或以上時攻擊力3倍、結算增加1COMBO；
			fullColor = nb(sk[0], attrsName);
			str = fullColor.length>1?"同时":"相连";
			str += `消除${sk[1]}个或以上的${fullColor.join("、")}宝珠时`;
			if (sk[2]) str += `，攻击力×${sk[2]/100}倍`;
			if (sk[3]) str += `，结算时连击数+${sk[3]}`;
			break;
		case 195:
			str = `HP 减少${sk[0]}%`;
			break;
		case 196:
			str = `无法消除宝珠状态减少${sk[0]}回合`;
			break;
		default:
			str = `未知的技能类型${type}(No.${id})`;
			//开发部分
			//const copySkill = JSON.parse(JSON.stringify(skill));
			//copySkill.params = copySkill.params.map(p=>{return [p,getBooleanFromBinary(p).join("")];});
			console.log(`未知的技能类型${type}(No.${id})`,findFullSkill(skill));
			break;
	}
	return (skill.description.length?(descriptionToHTML(skill.description) + "<hr>"):"") + str;
}