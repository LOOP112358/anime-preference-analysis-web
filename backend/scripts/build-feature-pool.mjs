/**
 * 从 Bangumi（与主站 scraper 相同链路）批量抓取条目，生成「备选库」JSON：
 * 每部番存 14 维特征向量 + 部分标签，供推荐在本地比对（不必每次对全站实时搜）。
 *
 * 用法：在 backend 目录执行  npm run build:feature-pool
 * 输出：../data/anime-feature-pool.json
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scrapeAnimeBundle } from "../services/scraper.js";
import { buildAggregatedTagScoresFromScrapedItems } from "../services/extractor.js";
import {
  rawDimensionVectorFromAggregatedTags,
  dimensionLabelSnapshot,
  dimensionVectorToArray,
} from "../services/contentVector.js";
import { DIMENSION_KEYS } from "../services/taxonomy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "..", "data", "anime-feature-pool.json");

/** 尽量覆盖不同口味；标题为常用中文/日文检索名，与画像模块一致走 Bangumi 搜索。 */
const RAW_TITLES = [
  // === 治愈/情感向 ===
  "Clannad",
  "四月是你的谎言",
  "我们仍未知道那天所看见的花的名字。",
  "Angel Beats!",
  "夏目友人帐",
  "紫罗兰永恒花园",
  "可塑性记忆",
  "Charlotte",
  "三月的狮子",
  "花开伊吕波",
  "虫师",
  "水星领航员",
  "飞翔的魔女",
  "蜂蜜与四叶草",
  "狼与香辛料",
  "白兔糖",
  "元气囝仔",

  // === 日常/轻松向 ===
  "轻音少女",
  "冰菓",
  "悠哉日常大王",
  "日常",
  "男子高中生的日常",
  "摇曳露营",
  "孤独摇滚",
  "齐木楠雄的灾难",
  "请问您今天要来点兔子吗",
  "干物妹小埋",
  "幸运星",
  "南家三姐妹",
  "迷糊餐厅",

  // === 恋爱/校园 ===
  "擅长捉弄的高木同学",
  "辉夜大小姐想让我告白",
  "龙与虎",
  "月刊少女野崎君",
  "堀与宫村",
  "玉子市场",
  "中二病也要谈恋爱",
  "青春猪头少年不会梦到兔女郎学姐",
  "月色真美",
  "俺物语",
  "好想告诉你",
  "ReLIFE",

  // === 热血/战斗 ===
  "进击的巨人",
  "鬼灭之刃",
  "咒术回战",
  "一拳超人",
  "我的英雄学院",
  "灵能百分百",
  "银魂",
  "火影忍者",
  "龙珠",
  "死神",
  "妖精的尾巴",
  "家庭教师",
  "钢之炼金术师",
  "天元突破",

  // === 运动/竞技 ===
  "排球少年",
  "强风吹拂",
  "黑子的篮球",
  "灌篮高手",
  "钻石王牌",
  "舞动青春",
  "飙速宅男",
  "MEGALO BOX",

  // === 科幻/机战 ===
  "新世纪福音战士",
  "星际牛仔",
  "攻壳机动队",
  "机动战士高达",
  "天元突破 红莲螺岩",
  "ALDNOAH.ZERO",
  "希德尼娅的骑士",

  // === 黑暗/悬疑/推理 ===
  "死亡笔记",
  "魔法少女小圆",
  "心理测量者",
  "未来日记",
  "寒蝉鸣泣之时",
  "只有我不存在的城市",
  "异度侵入",
  "寄生兽",
  "恶魔人 Crybaby",
  "东京喰种",
  "ANOTHER",
  "尸鬼",

  // === 幻想/异世界 ===
  "刀剑神域",
  "Re:从零开始的异世界生活",
  "关于我转生变成史莱姆这档事",
  "无职转生",
  "来自深渊",
  "为美好的世界献上祝福",
  "OVERLORD",
  "盾之勇者成名录",
  "游戏人生",
  "灰与幻想的格林姆迦尔",
  "葬送のフリーレン",
  "迷宫饭",

  // === 剧情/智斗 ===
  "命运石之门",
  "约定的梦幻岛",
  "夏日重现",
  "凉宫春日的忧郁",
  "重启咲良田",

  // === 现实/社会 ===
  "白箱",
  "樱花庄的宠物女孩",
  "比宇宙更远的地方",
  "昭和元禄落语心中",

  // === 音乐/偶像 ===
  "少女歌剧",
  "Love Live!",
  "吹响吧上低音号",
  "卡罗尔与星期二",
  "BanG Dream!",
  "偶像大师",

  // === 动作/冒险 ===
  "JOJO的奇妙冒险 石之海",
  "间谍过家家",
  "电锯人",
  "全职猎人",
  "海贼王",
  "浪客剑心",
  "混沌武士",

  // === 赛马娘/运动少女 ===
  "赛马娘 Pretty Derby",

  // === 长篇/国民级 ===
  "名侦探柯南",
  "多啦A梦",
  "蜡笔小新",

  // === 历史/文化 ===
  "战国BASARA",
  "浪客剑心 追忆篇",
  "虫师 续章",

  // === 女性向/BL/耽美 ===
  "冰上的尤里",
  "同级生",
  "佐佐木与宫野",
  "世界第一初恋",
  "given 被赠与的未来",

  // === 补充现代悬疑/奇幻 ===
  "光死去的夏天",

  // === 实验/艺术 ===
  "FLCL",
  "红辣椒",
  "千年女优",
  "玲音",

  // === 恐怖/灵异 ===
  "怪化猫",
  "魍魉之匣",

  // === 深度/哲学 ===
  "来自新世界",
  "银河英雄传说",
  "MONSTER",

  // === 补充热血 ===
  "幽游白书",
  "北斗神拳",
  "圣斗士星矢",
  "浪客剑心 明治剑客浪漫谭",
  "武装炼金",
  "黑执事",
  "青之驱魔师",
  "野良神",
  "血界战线",
  "文豪野犬",
  "炎炎消防队",
  "黑色五叶草",

  // === 补充科幻/机战 ===
  "银河英雄传说 Die Neue These",
  "苍穹之法芙娜",
  "全金属狂潮",
  "叛逆的鲁路修",
  "翠星之加尔刚蒂亚",
  "银河机攻队",
  "乐园追放",
  "BEATLESS",
  "轮回的拉格朗日",

  // === 补充奇幻/冒险 ===
  "魔笛MAGI",
  "七大罪",
  "在地下城寻求邂逅是否搞错了什么",
  "哥布林杀手",
  "兽娘动物园",
  "宝石之国",
  "少女终末旅行",
  "致不灭的你",
  "地缚少年花子君",

  // === 补充异世界 ===
  "Re:从零开始的异世界生活 第二季",
  "转生成蜘蛛又怎样",
  "平凡职业造就世界最强",
  "贤者之孙",
  "带着智慧型手机闯荡异世界",
  "爆肝工程师的异世界狂想曲",

  // === 补充日常/搞笑 ===
  "小林家的龙女仆",
  "珈百璃的堕落",
  "废天使加百列",
  "街角魔族",
  "恋爱研究所",
  "游戏三人娘",
  "荒川爆笑团",
  "学生会的一存",
  "超元气三姐妹",
  "妄想学生会",

  // === 补充恋爱 ===
  "伪恋",
  "路人女主的养成方法",
  "我的青春恋爱物语果然有问题",
  "Just Because",
  "无论何时我们的恋情都是10厘米",
  "告白实行委员会",
  "继母的拖油瓶是我的前女友",
  "更衣人偶坠入爱河",

  // === 补充悬疑/推理 ===
  "弹丸论破",
  "GOSICK",
  "冰菓 应该成为什么",
  "樱子小姐的脚下埋着尸体",
  "全部成为F",
  "乱步奇谭",

  // === 补充黑暗/压抑 ===
  "剑风传奇",
  "黑礁",
  "军火女王",
  "JOKER GAME",
  "91天",
  "ACCA13区监察课",

  // === 补充运动 ===
  "Free!",
  "YURI!!! on ICE",
  "网球优等生",
  "体操武士",
  "灼热的乒乓球娘",
  "竞女",

  // === 补充音乐 ===
  "交响情人梦",
  "钢琴之森",
  "一弦定音",
  "K-ON! 轻音少女 第二季",

  // === 补充治愈 ===
  "ARIA The ANIMATION",
  "玉响",
  "此花亭奇谭",
  "学园奶爸",

  // === 补充历史/时代 ===
  "鬼平",
  "江户盗贼团五叶",
  "真田十勇士",
  "活击 刀剑乱舞",

  // === 补充女性向 ===
  "歌之王子殿下",
  "IDOLiSH7",
  "月歌",
  "A3!",
  "募恋英雄",

  // === 补充短篇/泡面 ===
  "她和她的猫",
  "言叶之庭",
  "十字路口",
  "壳中少女",

  // === 补充经典 ===
  "阿基拉",
  "风之谷",
  "天空之城",
  "幽灵公主",
  "千与千寻",
  "哈尔的移动城堡",
  "萤火虫之墓",
  "龙猫",
  "魔女宅急便",
  "借东西的小人阿莉埃蒂",
  "你的名字",
  "天气之子",
  "秒速五厘米",
  "星之声",
  "云的彼端约定的地方",

  // === 补充热血/少年 ===
  "恶魔奶爸",
  "魔王的父亲",
  "滑头鬼之孙",
  "结界师",
  "植木的法则",
  "金色的卡修",
  "驱魔少年",
  "噬魂师",
  "闪灵二人组",
  "通灵王",

  // === 补充实验/小众 ===
  "绝望先生",
  "物语系列",
  "空中秋千",
  "四叠半神话大系",
  "永生之酒",
  "无头骑士异闻录",
  "人类衰退之后",
  "不吉波普不笑",

  // === 最后一批补充 ===
  "亚人",
  "黑之契约者",
  "大剑",
  "皇家国教骑士团",
  "速写者",
  "黑塚",
  "恐怖残响",
  "东京地震8.0",
  "古城荆棘王",
  "奇幻贵公子",
  "神灵狩",
  "电脑线圈",
  "萩萩公主",
  "灰羽联盟",
  "奇诺之旅",
  "死后文",
  "黑之契约者 流星之双子",
  "黑街二人组",
  "天使心跳",
  "黑执事 第二季",
  "夏目友人帐 第二季",
  "无头骑士异闻录 承",
  "物语系列 第二季",
  "昭和元禄落语心中 助六再临篇",
  "3月的狮子 第二季",
  "灵能百分百 第二季",
  "一拳超人 第二季",
  "鬼灭之刃 无限列车篇",
  "关于我转生变成史莱姆这档事 第二季",
  "为美好的世界献上祝福 第二季",
  "吹响吧上低音号 第二季",
  "轻音少女 第二季",
  "幸运星 OVA",
  "命运石之门0",
  "Fate/Zero",
  "Fate/stay night Unlimited Blade Works",
];

function dedupeQueries(titles) {
  const seen = new Set();
  const out = [];
  for (const t of titles) {
    const q = String(t || "").trim();
    if (!q) continue;
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

function isUsable(item) {
  if (!item || item.source === "unresolved") return false;
  const hasTags = (item.moe_tags?.length || 0) > 0 || (item.categories?.length || 0) > 0;
  const hasText = Boolean(String(item.text || "").trim());
  return hasTags || hasText;
}

function ensureDataDir() {
  const dir = path.resolve(__dirname, "..", "data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  const queries = dedupeQueries(RAW_TITLES);
  ensureDataDir();

  console.log(`Building feature pool: ${queries.length} titles → ${OUTPUT_PATH}\n`);

  const scraped = await scrapeAnimeBundle(queries);
  const items = [];
  const failures = [];

  for (let i = 0; i < scraped.length; i += 1) {
    const item = scraped[i];
    const queryTitle = queries[i];

    if (!isUsable(item)) {
      failures.push({
        query_title: queryTitle,
        resolved_title: item.title,
        reason: item.source === "unresolved" ? "unresolved" : "no_tags_or_summary",
        error: item.error || null,
      });
      console.log(`[${i + 1}/${queries.length}] ${queryTitle}  SKIP`);
      continue;
    }

    try {
      const aggregated = buildAggregatedTagScoresFromScrapedItems([item]);
      const raw = rawDimensionVectorFromAggregatedTags(aggregated);
      const dims = dimensionLabelSnapshot(raw);
      const vec = dimensionVectorToArray(raw);
      const tagsTop = Object.entries(aggregated)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16)
        .map(([name, weight]) => ({ name, weight: Number(Number(weight).toFixed(3)) }));

      items.push({
        query_title: queryTitle,
        title: item.title,
        source: item.source,
        dimensions_14: dims,
        vector_14: vec.map((v) => Number(v.toFixed(6))),
        tags_top: tagsTop,
      });
      console.log(`[${i + 1}/${queries.length}] ${item.title}  OK`);
    } catch (e) {
      failures.push({ query_title: queryTitle, reason: "exception", error: e.message });
      console.log(`[${i + 1}/${queries.length}] ${queryTitle}  ERROR: ${e.message}`);
    }
  }

  const payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    dimension_keys: [...DIMENSION_KEYS],
    item_count: items.length,
    items,
    failures,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`\n完成：写入 ${items.length} 条，失败 ${failures.length} 条。`);
  console.log(`文件：${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
