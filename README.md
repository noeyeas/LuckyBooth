# 🍀 인연: 행운상점 (LuckyBooth)

> **자연과학대학 × 인공지능융합대학 연합 축제 부스용 반응속도 게임**
>
> 🔗 **Live**: [noeyeas.github.io/LuckyBooth](https://noeyeas.github.io/LuckyBooth/)

축제 부스 현장에서 방문자가 태블릿으로 바로 플레이하는 웹 게임입니다.
네잎클로버가 나타나는 순간 화면을 터치해 반응속도를 재고, 부스 랭킹 보드에 기록을 남깁니다.

## 기능

- **3라운드 반응속도 측정** — 랜덤 대기 후 등장하는 클로버를 터치, 라운드별 결과 배지 표시
- **부정 방지** — 신호 전에 누르면 `Early` 처리로 해당 라운드 무효
- **부스 랭킹 보드** — `localStorage` 기반 순위 저장, 상위권 메달 표시
- **XSS 방어** — 참가자가 입력한 닉네임은 `escapeHtml()` 로 이스케이프 후 렌더

## 기술 스택

HTML5 · CSS3 · Vanilla JavaScript (빌드 단계 없음) · GitHub Pages

## 실행

```bash
git clone https://github.com/noeyeas/LuckyBooth.git
cd LuckyBooth
# index.html 을 브라우저로 열면 끝
```

## 파일 구조

```
LuckyBooth/
├── index.html   # 부스 소개 + 게임 화면
├── style.css    # 부스 브랜딩 스타일
└── script.js    # 게임 상태 머신 · 랭킹 관리
```
