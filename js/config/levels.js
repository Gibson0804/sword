import monsters from "./monsters";

/**
 * 关卡和技能配置
 * 使用 JS 文件而不是 JSON 文件，以便在微信小游戏中正确加载
 */
export default {
  "levels": [
    {
      "id": 1,
      "name": "第一关：村庄初遇",
      "description": "保卫你的村庄，击退第一波怪物入侵",
      "background": "images/bg/bg_level_1.jpg",
      "unlocked": true,
      "monsterTypes": ["niu"],
      // 关卡波数和每波怪兽类型、数量及刷新速度等配置，数组中每一项代表一波怪兽
      "monsterConfig": [
        {
          "monsterType": ["niu"],
          "monsterCount": 2,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu"],
          "monsterCount": 4,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu"],
          "monsterCount": 6,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu"],
          "monsterCount": 8,
          "monsterGenerateInterval": 60,
        },
      ]
    },
    {
      "id": 2,
      "name": "第二关：增援部队",
      "description": "更多的怪物正在接近，准备好迎接更大的挑战",
      "unlocked": true,
      "background": "images/bg/bg_level_2.jpg",
      "monsterTypes": ["niu", "feiji"],
      "monsterConfig": [
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 2,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 4,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 6,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 8,
          "monsterGenerateInterval": 60,
        },
      ]
    },
    {
      "id": 3,
      "name": "第三关：精英部队",
      "description": "更强大的怪物出现了，它们拥有更高的生命值",
      "unlocked": false,
      "background": "images/bg/bg_level_3.jpg",
      "monsterTypes": ["niu", "feiji"],
      "monsterConfig": [
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 2,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 4,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 6,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 8,
          "monsterGenerateInterval": 60,
        },
      ]
    },
    {
      "id": 4,
      "name": "第四关：狂暴入侵",
      "description": "怪物数量激增，准备好面对狂暴的入侵",
      "unlocked": false,
      "background": "images/bg/bg_level_4.jpg",
      "monsterTypes": ["niu", "feiji"],
      "monsterConfig": [
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 2,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 4,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 6,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 8,
          "monsterGenerateInterval": 60,
        },
      ]
    },
    {
      "id": 5,
      "name": "第五关：最终防线",
      "description": "这是最后的防线，全力保卫你的村庄",
      "unlocked": false,
      "background": "images/bg/bg_level_5.jpg",
      "monsterTypes": ["niu", "feiji"],
      "monsterConfig": [
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 2,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 4,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 6,
          "monsterGenerateInterval": 60,
        },
        {
          "monsterType": ["niu", "feiji"],
          "monsterCount": 8,
          "monsterGenerateInterval": 60,
        },
      ]
    }
  ],
  "skills": [
    {
      "id": "clearScreen",
      "name": "清屏技能",
      "description": "清除屏幕上所有怪物",
      "cooldown": 30,
      "icon": "images/skills/clearScreen.png"
    },
    {
      "id": "defenseBuff",
      "name": "防御增强",
      "description": "暂时增强防线和村庄的防御力",
      "cooldown": 25,
      "icon": "images/skills/defenseBuff.png"
    },
    {
      "id": "rapidFire",
      "name": "快速射击",
      "description": "暂时提高射击速度",
      "cooldown": 20,
      "icon": "images/skills/rapidFire.png"
    }
  ]
}
