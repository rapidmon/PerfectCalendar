/**
 * 멤버별 고유 색상 유틸리티
 * 그룹 모드에서 통장 소유자, 가계부 작성자 등을 구분하는 데 사용
 */

export const MEMBER_COLORS = [
    '#4A90E2', // 파랑
    '#E91E63', // 핑크
    '#27AE60', // 초록
    '#FF9800', // 주황
    '#9C27B0', // 보라
    '#009688', // 청록
    '#F44336', // 빨강
    '#3F51B5', // 남색
    '#795548', // 갈색
    '#607D8B', // 회청
];

/**
 * UID와 전체 멤버 UID 목록을 기반으로 일관된 색상을 반환합니다.
 * UID를 정렬하여 순서대로 색상을 할당하므로, 멤버가 추가/제거되어도
 * 기존 멤버의 색상은 최대한 유지됩니다.
 */
export function getMemberColor(
    uid: string,
    memberUids: string[],
    customColors?: { [uid: string]: string }
): string {
    if (customColors && customColors[uid]) return customColors[uid];
    const sorted = [...memberUids].sort();
    const idx = sorted.indexOf(uid);
    return MEMBER_COLORS[idx >= 0 ? idx % MEMBER_COLORS.length : 0];
}
