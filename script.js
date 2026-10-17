/**
 * 우리 반 1인 1역할 배정 도우미 - script.js
 * 초등학생 눈높이에 맞춘 1인 1역할 랜덤 배정 및 A4 인쇄, 구글 시트 연동 로직
 */

(function () {
  'use strict';

  // --- 기본 12명 예시 데이터 ---
  const DEFAULT_STUDENTS = [
    '김민준', '이서아', '박도윤', '최하은',
    '정예준', '강지우', '조수아', '윤시우',
    '장서윤', '임지후', '한아린', '오건우'
  ];

  const DEFAULT_ROLES = [
    { title: '칠판 도우미', desc: '칠판을 깨끗하게 닦고 분필과 지우개 가지런히 정리하기', icon: '🧹' },
    { title: '우유 도우미', desc: '우유 급식 수량 확인 및 다 마신 빈 우유갑 분리수거', icon: '🥛' },
    { title: '에너지 지킴이', desc: '쉬는 시간과 이동 수업 시 교실 전등 및 전자칠판 소등하기', icon: '💡' },
    { title: '환기 지킴이', desc: '아침과 쉬는 시간마다 창문을 열어 맑고 상쾌한 공기 순환하기', icon: '🪟' },
    { title: '줄반장', desc: '급식실이나 특별실로 이동할 때 앞장서서 바르고 안전하게 줄서기', icon: '🚶' },
    { title: '학습지 도우미', desc: '수업 시간 학습지와 가정통신문 친구들에게 빠짐없이 나눠주기', icon: '📄' },
    { title: '청소 도우미', desc: '빗자루와 쓰레받기를 정리하고 교실 바닥 쓰레기 확인하기', icon: '✨' },
    { title: '도서 도우미', desc: '학급문고 책장을 번호순으로 깔끔하게 정리하고 도서 관리하기', icon: '📚' },
    { title: '급식 예절 지킴이', desc: '급식 전 손 씻기 안내와 식사 중 질서 지키기 및 잔반 줄이기 독려', icon: '🍱' },
    { title: '식물 사랑이', desc: '교실 화분에 정성껏 물을 주고 싱그러운 잎사귀 닦아주기', icon: '🪴' },
    { title: '보건 지킴이', desc: '손 소독제 비치 및 체온계 정리, 아픈 친구 보건실 동행하기', icon: '🩹' },
    { title: '시간 알리미', desc: '수업 시작 1분 전 친구들에게 자리 정돈과 교과서 준비 알리기', icon: '⏰' }
  ];

  // --- 상태 관리 ---
  let students = [];
  let roles = [];
  let assignments = []; // Array of { roleTitle, roleDesc, roleIcon, studentName }
  let isShuffling = false;
  let currentSwapRoleIndex = null;

  // 로컬 스토리지 키
  const STORAGE_KEY_STUDENTS = 'school_role_students_v1';
  const STORAGE_KEY_ROLES = 'school_role_roles_v1';
  const STORAGE_KEY_ASSIGNMENTS = 'school_role_assignments_v1';
  const STORAGE_KEY_CLASS_NAME = 'school_role_class_name_v1';
  const STORAGE_KEY_GAS_URL = 'school_role_gas_url_v1';

  // --- DOM 요소 참조 ---
  const inputClassTitle = document.getElementById('inputClassTitle');
  const displayClassTitle = document.getElementById('displayClassTitle');
  const printClassTitle = document.getElementById('printClassTitle');
  const printDateDisplay = document.getElementById('printDateDisplay');
  const statStudentCount = document.getElementById('statStudentCount');
  const statRoleCount = document.getElementById('statRoleCount');
  const statStatusBadge = document.getElementById('statStatusBadge');
  const manageCountPreview = document.getElementById('manageCountPreview');

  const btnAssign = document.getElementById('btnAssign');
  const btnPlaceholderAssign = document.getElementById('btnPlaceholderAssign');
  const btnReshuffle = document.getElementById('btnReshuffle');
  const btnCopyResult = document.getElementById('btnCopyResult');
  const btnToggleManage = document.getElementById('btnToggleManage');
  const btnPrint = document.getElementById('btnPrint');

  // 관리 패널 DOM
  const managePanel = document.getElementById('managePanel');
  const btnCloseManage = document.getElementById('btnCloseManage');
  const btnResetDefault = document.getElementById('btnResetDefault');
  const studentsTextarea = document.getElementById('studentsTextarea');
  const rolesTextarea = document.getElementById('rolesTextarea');
  const btnApplyStudents = document.getElementById('btnApplyStudents');
  const btnApplyRoles = document.getElementById('btnApplyRoles');
  const btnQuickAddStudent = document.getElementById('btnQuickAddStudent');
  const btnQuickAddRole = document.getElementById('btnQuickAddRole');
  const manageStudentCount = document.getElementById('manageStudentCount');
  const manageRoleCount = document.getElementById('manageRoleCount');

  // 그리드 & 상태
  const cardsGrid = document.getElementById('cardsGrid');
  const emptyPlaceholder = document.getElementById('emptyPlaceholder');
  const assignedTimestamp = document.getElementById('assignedTimestamp');

  // 구글 시트 모달 DOM
  const btnOpenSheetLoad = document.getElementById('btnOpenSheetLoad');
  const btnOpenSheetSave = document.getElementById('btnOpenSheetSave');
  const sheetModal = document.getElementById('sheetModal');
  const btnCloseSheetModal = document.getElementById('btnCloseSheetModal');
  const gasUrlInput = document.getElementById('gasUrlInput');
  const btnSaveGasUrl = document.getElementById('btnSaveGasUrl');
  const btnExecuteSheetLoad = document.getElementById('btnExecuteSheetLoad');
  const btnExecuteSheetSave = document.getElementById('btnExecuteSheetSave');
  const sheetStatusMessage = document.getElementById('sheetStatusMessage');
  const btnCopyGasCode = document.getElementById('btnCopyGasCode');
  const gasCodeSnippet = document.getElementById('gasCodeSnippet');

  // 맞교환 모달 DOM
  const swapModal = document.getElementById('swapModal');
  const btnCloseSwapModal = document.getElementById('btnCloseSwapModal');
  const btnCancelSwap = document.getElementById('btnCancelSwap');
  const btnConfirmSwap = document.getElementById('btnConfirmSwap');
  const swapRoleTitleText = document.getElementById('swapRoleTitleText');
  const swapStudentSelect = document.getElementById('swapStudentSelect');

  // 토스트 메시지
  const toastMessage = document.getElementById('toastMessage');

  // --- 초기화 함수 ---
  function init() {
    loadSavedData();
    bindEvents();
    syncUIWithData();
    updatePrintDate();
  }

  // --- 데이터 불러오기 및 기본값 세팅 ---
  function loadSavedData() {
    const savedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
    const savedRoles = localStorage.getItem(STORAGE_KEY_ROLES);
    const savedAssignments = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    const savedClassName = localStorage.getItem(STORAGE_KEY_CLASS_NAME);
    const savedGasUrl = localStorage.getItem(STORAGE_KEY_GAS_URL);

    students = savedStudents ? JSON.parse(savedStudents) : [...DEFAULT_STUDENTS];
    roles = savedRoles ? JSON.parse(savedRoles) : JSON.parse(JSON.stringify(DEFAULT_ROLES));

    if (savedClassName) {
      inputClassTitle.value = savedClassName;
    }

    if (savedGasUrl) {
      gasUrlInput.value = savedGasUrl;
    }

    if (savedAssignments) {
      try {
        assignments = JSON.parse(savedAssignments);
      } catch (e) {
        assignments = [];
      }
    }
  }

  // --- 상태 저장 ---
  function saveData() {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
    localStorage.setItem(STORAGE_KEY_CLASS_NAME, inputClassTitle.value);
  }

  // --- UI와 데이터 동기화 ---
  function syncUIWithData() {
    const currentClass = inputClassTitle.value.trim() || '우리 반';
    displayClassTitle.textContent = `${currentClass} 1인 1역할 배정 결과`;
    printClassTitle.textContent = `🌟 ${currentClass} 1인 1역할 배정표 🌟`;

    statStudentCount.textContent = `${students.length}명`;
    statRoleCount.textContent = `${roles.length}개`;
    manageCountPreview.textContent = `${students.length}`;
    manageStudentCount.textContent = `${students.length}`;
    manageRoleCount.textContent = `${roles.length}`;

    // 관리 패널 텍스트박스 동기화
    studentsTextarea.value = students.join(', ');
    rolesTextarea.value = roles.map(r => `${r.title}:${r.desc || ''}`).join('\n');

    // 배정 상태 업데이트
    if (assignments && assignments.length > 0) {
      statStatusBadge.textContent = '배정 완료';
      statStatusBadge.className = 'stat-status assigned';
      btnReshuffle.disabled = false;
      btnCopyResult.disabled = false;
      emptyPlaceholder.classList.add('hidden');
      cardsGrid.classList.remove('hidden');
      renderCards();
    } else {
      statStatusBadge.textContent = '배정 대기중';
      statStatusBadge.className = 'stat-status waiting';
      btnReshuffle.disabled = true;
      btnCopyResult.disabled = true;
      emptyPlaceholder.classList.remove('hidden');
      cardsGrid.classList.add('hidden');
    }
  }

  // --- 인쇄용 날짜 표기 갱신 ---
  function updatePrintDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const day = dayNames[now.getDay()];
    printDateDisplay.textContent = `배정일자: ${year}년 ${month}월 ${date}일 (${day})`;
  }

  // --- 역할 배정 핵심 로직 (랜덤 셔플) ---
  function assignRoles() {
    if (isShuffling) return;

    if (students.length === 0) {
      showToast('⚠️ 학생 명단이 비어있습니다. 학생을 등록해주세요.');
      return;
    }
    if (roles.length === 0) {
      showToast('⚠️ 역할 목록이 비어있습니다. 역할을 등록해주세요.');
      return;
    }

    isShuffling = true;
    btnAssign.disabled = true;
    if (btnReshuffle) btnReshuffle.disabled = true;

    // 학생 복사본 생성 후 Fisher-Yates 셔플
    const shuffledStudents = [...students];
    for (let i = shuffledStudents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledStudents[i], shuffledStudents[j]] = [shuffledStudents[j], shuffledStudents[i]];
    }

    // 카드 그리드 준비
    emptyPlaceholder.classList.add('hidden');
    cardsGrid.classList.remove('hidden');

    // 셔플 애니메이션 연출 (약 500ms 동안 롤링)
    renderShufflingAnimation();

    setTimeout(() => {
      // 1:1 매칭 구성
      const newAssignments = [];
      const matchCount = Math.min(roles.length, shuffledStudents.length);

      for (let i = 0; i < matchCount; i++) {
        const role = roles[i];
        const student = shuffledStudents[i];
        newAssignments.push({
          roleTitle: role.title,
          roleDesc: role.desc || '',
          roleIcon: role.icon || getRoleEmoji(role.title),
          studentName: student
        });
      }

      // 학생이 역할보다 많은 경우 추가 학생 처리
      if (shuffledStudents.length > roles.length) {
        for (let i = roles.length; i < shuffledStudents.length; i++) {
          const roleIndex = i % roles.length;
          newAssignments.push({
            roleTitle: `${roles[roleIndex].title} (공동)`,
            roleDesc: roles[roleIndex].desc || '',
            roleIcon: roles[roleIndex].icon || '🤝',
            studentName: shuffledStudents[i]
          });
        }
      }

      assignments = newAssignments;
      saveData();

      // UI 렌더링
      renderCards(true);

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      assignedTimestamp.textContent = `최근 배정 시각: ${timeStr}`;

      statStatusBadge.textContent = '배정 완료';
      statStatusBadge.className = 'stat-status assigned';
      btnReshuffle.disabled = false;
      btnCopyResult.disabled = false;

      isShuffling = false;
      btnAssign.disabled = false;

      showToast('🎉 학생 1인 1역할이 성공적으로 배정되었습니다!');
    }, 600);
  }

  // 임의의 역할 이름에 어울리는 이모지 자동 매핑 헬퍼
  function getRoleEmoji(title) {
    if (/칠판/.test(title)) return '🧹';
    if (/우유/.test(title)) return '🥛';
    if (/전등|에너지|전기/.test(title)) return '💡';
    if (/환기|창문|공기/.test(title)) return '🪟';
    if (/줄|행렬|이동/.test(title)) return '🚶';
    if (/학습지|유인물|프린트|안내장/.test(title)) return '📄';
    if (/청소|빗자루|바닥/.test(title)) return '✨';
    if (/도서|책|독서/.test(title)) return '📚';
    if (/급식|식사|밥/.test(title)) return '🍱';
    if (/식물|화분|꽃/.test(title)) return '🪴';
    if (/보건|약|체온|건강/.test(title)) return '🩹';
    if (/시간|종|알림/.test(title)) return '⏰';
    if (/신발|신발장/.test(title)) return '👟';
    if (/체육|공|체육부/.test(title)) return '⚽';
    return '⭐';
  }

  // 셔플 도중 보여줄 임시 애니메이션
  function renderShufflingAnimation() {
    cardsGrid.innerHTML = '';
    const count = Math.min(roles.length, students.length);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = `role-card theme-${i % 6} shuffling`;
      card.innerHTML = `
        <div class="card-top">
          <span class="card-num">${i + 1}</span>
          <span class="card-icon">🎲</span>
        </div>
        <div class="card-role-title">${roles[i].title}</div>
        <div class="student-badge-box">
          <span class="student-label">배정 추첨 중...</span>
          <span class="student-name">???</span>
        </div>
        <div class="card-desc">${roles[i].desc || '역할을 성실히 수행합니다.'}</div>
      `;
      fragment.appendChild(card);
    }
    cardsGrid.appendChild(fragment);
  }

  // --- 카드 그리드 렌더링 ---
  function renderCards(withAnimation = false) {
    cardsGrid.innerHTML = '';
    if (!assignments || assignments.length === 0) return;

    const fragment = document.createDocumentFragment();

    assignments.forEach((item, index) => {
      const card = document.createElement('div');
      const themeIndex = index % 6;
      card.className = `role-card theme-${themeIndex} ${withAnimation ? 'assigned-pop' : ''}`;
      if (withAnimation) {
        card.style.animationDelay = `${index * 35}ms`;
      }

      card.innerHTML = `
        <div class="card-top">
          <span class="card-num">${index + 1}</span>
          <span class="card-icon">${item.roleIcon}</span>
          <button class="card-swap-btn no-print" data-index="${index}" title="담당 학생 바꾸기">
            학생 변경
          </button>
        </div>
        <div class="card-role-title">
          <span>${item.roleTitle}</span>
        </div>
        <div class="student-badge-box">
          <span class="student-label">담당 학생</span>
          <span class="student-name">${item.studentName}</span>
        </div>
        <div class="card-desc">
          ${item.roleDesc || '우리 반을 위해 주어진 역할을 책임감 있게 완수합니다.'}
        </div>
      `;

      // 카드 클릭 시 학생 변경 모달 열기
      card.addEventListener('click', (e) => {
        // 이미 버튼을 눌렀다면 이벤트 버블링으로 처리
        openSwapModal(index);
      });

      fragment.appendChild(card);
    });

    cardsGrid.appendChild(fragment);
  }

  // --- 학생 변경 (맞교환) 모달 열기 ---
  function openSwapModal(index) {
    currentSwapRoleIndex = index;
    const targetAssignment = assignments[index];
    if (!targetAssignment) return;

    swapRoleTitleText.textContent = `[${targetAssignment.roleTitle}]`;

    // 학생 선택 셀렉트박스 채우기
    swapStudentSelect.innerHTML = '';
    students.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      // 현재 다른 역할을 맡고 있는지 표시
      const currentRole = assignments.find(a => a.studentName === st);
      if (st === targetAssignment.studentName) {
        opt.textContent = `${st} (현재 담당)`;
        opt.selected = true;
      } else if (currentRole) {
        opt.textContent = `${st} (${currentRole.roleTitle} 담당 중 - 맞교환)`;
      } else {
        opt.textContent = `${st} (미배정)`;
      }
      swapStudentSelect.appendChild(opt);
    });

    swapModal.classList.remove('hidden');
  }

  function closeSwapModal() {
    swapModal.classList.add('hidden');
    currentSwapRoleIndex = null;
  }

  function applyStudentSwap() {
    if (currentSwapRoleIndex === null) return;
    const selectedStudent = swapStudentSelect.value;
    const targetAssignment = assignments[currentSwapRoleIndex];
    const previousStudent = targetAssignment.studentName;

    if (selectedStudent === previousStudent) {
      closeSwapModal();
      return;
    }

    // 만약 선택된 학생이 이미 다른 역할을 맡고 있다면 맞교환(Swap)
    const otherAssignment = assignments.find(a => a.studentName === selectedStudent);
    if (otherAssignment) {
      otherAssignment.studentName = previousStudent;
      targetAssignment.studentName = selectedStudent;
      showToast(`🔄 [${targetAssignment.roleTitle}] ${selectedStudent}님과 [${otherAssignment.roleTitle}] ${previousStudent}님의 역할이 맞교환되었습니다.`);
    } else {
      targetAssignment.studentName = selectedStudent;
      showToast(`✅ [${targetAssignment.roleTitle}] 담당자가 ${selectedStudent} 학생으로 변경되었습니다.`);
    }

    saveData();
    renderCards(false);
    closeSwapModal();
  }

  // --- 결과 텍스트 복사 (알림장/메신저용) ---
  function copyResultsToClipboard() {
    if (!assignments || assignments.length === 0) {
      showToast('⚠️ 먼저 역할을 배정해주세요.');
      return;
    }

    const currentClass = inputClassTitle.value.trim() || '우리 반';
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;

    let text = `🏫 [${currentClass} 1인 1역할 배정표] (${dateStr})\n`;
    text += `------------------------------------\n`;
    assignments.forEach((item, idx) => {
      text += `${idx + 1}. ${item.studentName} : ${item.roleTitle} ${item.roleIcon} (${item.roleDesc})\n`;
    });
    text += `------------------------------------\n`;
    text += `모두가 주인공이 되어 책임감 있게 역할을 실천해요! ✨`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 배정 결과가 클립보드에 복사되었습니다! (알림장/메신저에 붙여넣기)');
    }).catch(() => {
      // 복사 권한 오류 대체
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 배정 결과가 복사되었습니다!');
    });
  }

  // --- A4 인쇄 실행 ---
  function triggerPrint() {
    if (!assignments || assignments.length === 0) {
      // 배정되지 않은 상태라면 자동으로 먼저 배정할지 안내
      const confirmAutoAssign = confirm('아직 역할이 배정되지 않았습니다. 자동으로 1인 1역할을 배정하고 인쇄하시겠습니까?');
      if (confirmAutoAssign) {
        assignRoles();
        setTimeout(() => {
          updatePrintDate();
          window.print();
        }, 700);
      }
      return;
    }

    updatePrintDate();
    window.print();
  }

  // --- 관리 패널 적용 로직 ---
  function applyStudentsInput() {
    const raw = studentsTextarea.value.trim();
    if (!raw) {
      showToast('⚠️ 학생 이름을 1명 이상 입력해주세요.');
      return;
    }

    const parsed = raw
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (parsed.length === 0) {
      showToast('⚠️ 유효한 학생 이름이 없습니다.');
      return;
    }

    students = parsed;
    saveData();
    syncUIWithData();
    showToast(`👦👧 학생 명단이 업데이트되었습니다. (총 ${students.length}명)`);
  }

  function applyRolesInput() {
    const raw = rolesTextarea.value.trim();
    if (!raw) {
      showToast('⚠️ 역할을 1개 이상 입력해주세요.');
      return;
    }

    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedRoles = [];

    lines.forEach(line => {
      let title = line;
      let desc = '';
      if (line.includes(':')) {
        const parts = line.split(':');
        title = parts[0].trim();
        desc = parts.slice(1).join(':').trim();
      } else if (line.includes('-')) {
        const parts = line.split('-');
        title = parts[0].trim();
        desc = parts.slice(1).join('-').trim();
      }
      parsedRoles.push({
        title: title,
        desc: desc,
        icon: getRoleEmoji(title)
      });
    });

    if (parsedRoles.length === 0) {
      showToast('⚠️ 유효한 역할이 없습니다.');
      return;
    }

    roles = parsedRoles;
    saveData();
    syncUIWithData();
    showToast(`⭐ 역할 목록이 업데이트되었습니다. (총 ${roles.length}개)`);
  }

  function resetToDefaults() {
    if (confirm('기본 12명 학생 및 12개 역할 데이터로 되돌리시겠습니까?')) {
      students = [...DEFAULT_STUDENTS];
      roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
      assignments = [];
      saveData();
      syncUIWithData();
      showToast('🔄 기본 데이터(학생 12명, 역할 12개)로 초기화되었습니다.');
    }
  }

  // --- 구글 시트 연동 모달 & 통신 ---
  function openSheetModal(targetAction) {
    sheetModal.classList.remove('hidden');
    sheetStatusMessage.classList.add('hidden');
    sheetStatusMessage.textContent = '';
    sheetStatusMessage.className = 'sheet-status hidden';

    if (targetAction === 'save') {
      btnExecuteSheetSave.focus();
    } else if (targetAction === 'load') {
      btnExecuteSheetLoad.focus();
    }
  }

  function closeSheetModal() {
    sheetModal.classList.add('hidden');
  }

  function saveGasUrl() {
    const url = gasUrlInput.value.trim();
    localStorage.setItem(STORAGE_KEY_GAS_URL, url);
    closeSheetModal();
    showToast('💾 스프레드시트 연동 URL이 저장되었습니다.');
  }

  // 시트에서 데이터 불러오기 (doGet 호출)
  async function executeSheetLoad() {
    const gasUrl = gasUrlInput.value.trim();
    if (!gasUrl) {
      setSheetStatus('⚠️ 먼저 배포된 Google Apps Script 웹 앱 URL을 입력해주세요.', 'error');
      gasUrlInput.focus();
      return;
    }

    setSheetStatus('⏳ 구글 스프레드시트에서 학생 및 역할 데이터를 가져오는 중입니다...', 'loading');

    try {
      const response = await fetch(gasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류 (HTTP ${response.status})`);
      }

      const data = await response.json();

      if (data && data.students && data.students.length > 0) {
        students = data.students;
      }
      if (data && data.roles && data.roles.length > 0) {
        roles = data.roles.map(r => ({
          title: typeof r === 'string' ? r : r.title,
          desc: typeof r === 'string' ? '' : (r.desc || ''),
          icon: getRoleEmoji(typeof r === 'string' ? r : r.title)
        }));
      }

      saveData();
      syncUIWithData();
      setSheetStatus(`✅ 성공! 시트에서 학생 ${data.students?.length || 0}명, 역할 ${data.roles?.length || 0}개를 성공적으로 불러왔습니다!`, 'success');
      showToast('🔄 구글 시트 데이터가 성공적으로 반영되었습니다.');
    } catch (err) {
      console.warn('Apps Script GET 요청 오류:', err);
      setSheetStatus(`❌ 시트 불러오기 실패: ${err.message}. (배포 권한이 '모든 사용자'로 설정되어 있는지 확인해주세요)`, 'error');
    }
  }

  // 시트에 배정 결과 저장하기 (doPost 호출)
  async function executeSheetSave() {
    const gasUrl = gasUrlInput.value.trim();
    if (!gasUrl) {
      setSheetStatus('⚠️ 먼저 배포된 Google Apps Script 웹 앱 URL을 입력해주세요.', 'error');
      gasUrlInput.focus();
      return;
    }

    if (!assignments || assignments.length === 0) {
      setSheetStatus('⚠️ 먼저 역할을 배정해주세요. 배정 결과가 비어있습니다.', 'error');
      return;
    }

    setSheetStatus('⏳ 현재 배정 결과를 구글 스프레드시트에 저장하는 중입니다...', 'loading');

    const payload = {
      className: inputClassTitle.value.trim() || '우리 반',
      timestamp: new Date().toISOString(),
      assignments: assignments.map(a => ({
        student: a.studentName,
        role: a.roleTitle,
        desc: a.roleDesc
      }))
    };

    try {
      // Apps Script 웹 앱 POST 전송 (CORS 프리플라이트 회피를 위해 text/plain 허용 또는 no-cors 고려)
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      setSheetStatus(`✅ 배정 결과 ${payload.assignments.length}건이 구글 스프레드시트에 안전하게 저장되었습니다!`, 'success');
      showToast('💾 구글 시트에 배정 결과가 저장되었습니다.');
    } catch (err) {
      console.warn('Apps Script POST 요청 실패:', err);
      setSheetStatus(`❌ 시트 저장 실패: ${err.message}. Google Apps Script의 doPost() 함수와 배포 권한 설정을 확인하세요.`, 'error');
    }
  }

  function setSheetStatus(text, type) {
    sheetStatusMessage.textContent = text;
    sheetStatusMessage.className = `sheet-status ${type}`;
    sheetStatusMessage.classList.remove('hidden');
  }

  // --- 토스트 메시지 표시 유틸 ---
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toastMessage.classList.remove('hidden');

    toastTimer = setTimeout(() => {
      toastMessage.classList.add('hidden');
    }, 3200);
  }

  // --- 이벤트 바인딩 ---
  function bindEvents() {
    // 메인 배정
    btnAssign.addEventListener('click', assignRoles);
    btnPlaceholderAssign.addEventListener('click', assignRoles);
    btnReshuffle.addEventListener('click', assignRoles);
    btnCopyResult.addEventListener('click', copyResultsToClipboard);
    btnPrint.addEventListener('click', triggerPrint);

    // 학급명칭 변경 시 자동 저장
    inputClassTitle.addEventListener('input', () => {
      syncUIWithData();
      saveData();
    });

    // 관리 패널 토글
    btnToggleManage.addEventListener('click', () => {
      managePanel.classList.toggle('hidden');
      if (!managePanel.classList.contains('hidden')) {
        studentsTextarea.focus();
      }
    });

    btnCloseManage.addEventListener('click', () => {
      managePanel.classList.add('hidden');
    });

    btnResetDefault.addEventListener('click', resetToDefaults);
    btnApplyStudents.addEventListener('click', applyStudentsInput);
    btnApplyRoles.addEventListener('click', applyRolesInput);

    // 간편 추가 버튼들
    btnQuickAddStudent.addEventListener('click', () => {
      const name = prompt('추가할 학생의 이름을 입력하세요:');
      if (name && name.trim()) {
        students.push(name.trim());
        saveData();
        syncUIWithData();
        showToast(`👦👧 [${name.trim()}] 학생이 추가되었습니다.`);
      }
    });

    btnQuickAddRole.addEventListener('click', () => {
      const title = prompt('새 역할 이름을 입력하세요 (예: 재활용 도우미):');
      if (title && title.trim()) {
        const desc = prompt('역할 설명을 간단히 적어주세요 (예: 분리수거함 정리):', '') || '';
        roles.push({
          title: title.trim(),
          desc: desc.trim(),
          icon: getRoleEmoji(title.trim())
        });
        saveData();
        syncUIWithData();
        showToast(`⭐ [${title.trim()}] 역할이 추가되었습니다.`);
      }
    });

    // 구글 시트 모달 이벤트
    btnOpenSheetLoad.addEventListener('click', () => openSheetModal('load'));
    btnOpenSheetSave.addEventListener('click', () => openSheetModal('save'));
    btnCloseSheetModal.addEventListener('click', closeSheetModal);
    btnSaveGasUrl.addEventListener('click', saveGasUrl);
    btnExecuteSheetLoad.addEventListener('click', executeSheetLoad);
    btnExecuteSheetSave.addEventListener('click', executeSheetSave);

    // 모달 배경 클릭 시 닫기
    sheetModal.addEventListener('click', (e) => {
      if (e.target === sheetModal) closeSheetModal();
    });
    swapModal.addEventListener('click', (e) => {
      if (e.target === swapModal) closeSwapModal();
    });

    // 맞교환 모달 이벤트
    btnCloseSwapModal.addEventListener('click', closeSwapModal);
    btnCancelSwap.addEventListener('click', closeSwapModal);
    btnConfirmSwap.addEventListener('click', applyStudentSwap);

    // 코드 복사 버튼
    btnCopyGasCode.addEventListener('click', () => {
      const code = gasCodeSnippet.textContent;
      navigator.clipboard.writeText(code).then(() => {
        showToast('📋 Apps Script 코드가 복사되었습니다.');
      });
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!sheetModal.classList.contains('hidden')) closeSheetModal();
        if (!swapModal.classList.contains('hidden')) closeSwapModal();
      }
    });
  }

  // 실행 시작
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
