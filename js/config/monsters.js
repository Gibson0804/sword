/**
 * 怪物基础属性配置
 * 后续如需增加新怪物，只需在 monsters 数组中添加即可
 */
export default {
  "monsters": [
    {
      "type": "niu",
      "name": "牛怪",
      "width": 0.08,
      "height": 0.1,
      "hp": 3,
      "speed": 0.25,
      "frames": [
        "images/npc/niu/niu_01.png",
        "images/npc/niu/niu_02.png",
        "images/npc/niu/niu_03.png",
        "images/npc/niu/niu_04.png",
        "images/npc/niu/niu_05.png",
        "images/npc/niu/niu_06.png",
        "images/npc/niu/niu_07.png",
        "images/npc/niu/niu_08.png",
        "images/npc/niu/niu_09.png"
      ],
      "attack": 10,
      "score": 10,
      "desc": "基础型怪物，速度适中，血量一般"
    },
    {
      "type": "feiji",
      "name": "飞行怪",
      "width": 0.1,
      "height": 0.1,
      "hp": 2,
      "speed": 0.4,
      "frames": [
        "images/npc/feiji/feiji_1.png",
        "images/npc/feiji/feiji_2.png",
        "images/npc/feiji/feiji_3.png"
      ],
      "attack": 8,
      "score": 20,
      "desc": "飞行型怪物，速度快，血量较低"
    }
  ]
};
