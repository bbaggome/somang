// 랜덤 닉네임 생성을 위한 단어 배열
const adjectives = [
  '행복한', '즐거운', '신나는', '활발한', '똑똑한',
  '귀여운', '멋진', '빠른', '용감한', '친절한',
  '재미있는', '밝은', '따뜻한', '시원한', '달콤한',
  '상쾌한', '편안한', '자유로운', '건강한', '평화로운'
];

const nouns = [
  '고양이', '강아지', '토끼', '팬더', '코알라',
  '펭귄', '돌고래', '나비', '별', '달',
  '구름', '바람', '파도', '산', '꽃',
  '나무', '새', '물고기', '사자', '호랑이'
];

/**
 * 형용사 + 명사 + 3자리 숫자 형태의 랜덤 닉네임을 생성합니다.
 * 예: "행복한고양이123"
 */
export function generateRandomNickname(): string {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 900) + 100; // 100-999 사이의 숫자
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
}