/**
 * 우리 반 1인 1역할 배정 도우미 - script.js (토이스토리 에디션)
 * - 2초 동안 스스로 3D 회전하는 주사위 롤링 연출
 * - Web Audio API 기반 사실적인 주사위 딸깍거림 효과음 & 결과 발표 차임벨
 * - 1인 1역할 랜덤 1:1 매칭, 맞교환, A4 인쇄, 구글 시트 연동
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
  let assignments = [];
  let isRolling = false;
  let currentSwapRoleIndex = null;
  let isSoundEnabled = true;

  // 로컬 스토리지 키
  const STORAGE_KEY_STUDENTS = 'school_role_students_v1';
  const STORAGE_KEY_ROLES = 'school_role_roles_v1';
  const STORAGE_KEY_ASSIGNMENTS = 'school_role_assignments_v1';
  const STORAGE_KEY_CLASS_NAME = 'school_role_class_name_v1';
  const STORAGE_KEY_GAS_URL = 'school_role_gas_url_v1';
  const STORAGE_KEY_SOUND = 'school_role_sound_v1';

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
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  // 3D 주사위 오버레이
  const diceOverlay = document.getElementById('diceOverlay');
  const diceProgressFill = document.getElementById('diceProgressFill');
  const diceTimerCounter = document.getElementById('diceTimerCounter');

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

  // --- Web Audio API 사운드 생성기 ---
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // 주사위 딸깍거림 단일 클릭음 (나무/플라스틱 주사위 충돌음)
  function playDiceClick(timeOffset = 0, pitchVariation = 1.0) {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + timeOffset;

    // 1. 노이즈 버스트 생성 (주사위 모서리 마찰음)
    const bufferSize = ctx.sampleRate * 0.035; // 35ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // 밴드패스 필터로 딱딱한 주사위 텍스처 형성
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 * pitchVariation, now);
    filter.Q.setValueAtTime(3.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.035);

    // 2. 바닥 통통 튀는 저음 충돌음
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * pitchVariation, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // 2초 동안 이어지는 실감나는 주사위 굴림 사운드 시퀀스
  function playRollingDiceAudio(durationSeconds = 2.0) {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // 2초 동안 18회 불규칙한 간격으로 딸깍거림 발생
    let currentOffset = 0;
    const totalHits = 20;

    for (let i = 0; i < totalHits; i++) {
      // 주사위가 굴러가며 서서히 튀는 간격이 변화하는 물리감
      const interval = 0.06 + Math.random() * 0.07;
      currentOffset += interval;
      if (currentOffset >= durationSeconds - 0.1) break;

      const pitch = 0.8 + Math.random() * 0.6;
      playDiceClick(currentOffset, pitch);
    }
  }

  // 2초 후 주사위가 멈추고 결과가 뜰 때 울리는 신나는 차임벨 효과음
  function playCelebrationFanfare() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // C5, E5, G5, C6 하모니
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const noteTime = now + (idx * 0.08);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  // --- 사운드 토글 UI ---
  function updateSoundUI() {
    if (isSoundEnabled) {
      soundIcon.textContent = '🔊';
      soundText.textContent = '효과음 ON';
      btnToggleSound.classList.remove('btn-muted');
    } else {
      soundIcon.textContent = '🔇';
      soundText.textContent = '효과음 OFF';
      btnToggleSound.classList.add('btn-muted');
    }
  }

  function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem(STORAGE_KEY_SOUND, isSoundEnabled ? 'true' : 'false');
    updateSoundUI();
    if (isSoundEnabled) {
      playDiceClick(0, 1.2);
      showToast('🔊 효과음이 켜졌습니다.');
    } else {
      showToast('🔇 효과음이 꺼졌습니다.');
    }
  }

  // --- 초기화 함수 ---
  function init() {
    loadSavedData();
    bindEvents();
    syncUIWithData();
    updatePrintDate();
    updateSoundUI();
  }

  // --- 데이터 불러오기 ---
  function loadSavedData() {
    const savedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
    const savedRoles = localStorage.getItem(STORAGE_KEY_ROLES);
    const savedAssignments = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    const savedClassName = localStorage.getItem(STORAGE_KEY_CLASS_NAME);
    const savedGasUrl = localStorage.getItem(STORAGE_KEY_GAS_URL);
    const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);

    students = savedStudents ? JSON.parse(savedStudents) : [...DEFAULT_STUDENTS];
    roles = savedRoles ? JSON.parse(savedRoles) : JSON.parse(JSON.stringify(DEFAULT_ROLES));

    if (savedClassName) {
      inputClassTitle.value = savedClassName;
    }

    if (savedGasUrl) {
      gasUrlInput.value = savedGasUrl;
    }

    if (savedSound !== null) {
      isSoundEnabled = savedSound === 'true';
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

    studentsTextarea.value = students.join(', ');
    rolesTextarea.value = roles.map(r => `${r.title}:${r.desc || ''}`).join('\n');

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

  function updatePrintDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const day = dayNames[now.getDay()];
    printDateDisplay.textContent = `배정일자: ${year}년 ${month}월 ${date}일 (${day})`;
  }

  // ==========================================================================
  // [핵심 요구사항] 주사위가 2초 동안 스스로 회전하고 효과음 재생 후 배정 결과 표시
  // ==========================================================================
  function assignRolesWithDiceAnimation() {
    if (isRolling) return;

    if (students.length === 0) {
      showToast('⚠️ 학생 명단이 비어있습니다. 학생을 등록해주세요.');
      return;
    }
    if (roles.length === 0) {
      showToast('⚠️ 역할 목록이 비어있습니다. 역할을 등록해주세요.');
      return;
    }

    isRolling = true;
    btnAssign.disabled = true;
    if (btnReshuffle) btnReshuffle.disabled = true;

    // 1. 3D 주사위 오버레이 표시 & 프로그레스 초기화
    diceOverlay.classList.remove('hidden');
    diceProgressFill.style.width = '0%';
    diceTimerCounter.textContent = '2.0초';

    // 2. 주사위 효과음 재생 (2초 동안 실감나는 롤링 사운드)
    playRollingDiceAudio(2.0);

    // 3. 2초 동안 타이머 & 프로그레스 바 갱신 (60fps requestAnimationFrame)
    const TOTAL_DURATION = 2000; // 정확히 2초
    const startTime = performance.now();

    function updateProgress(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / TOTAL_DURATION, 1);
      const remainingSeconds = Math.max((TOTAL_DURATION - elapsed) / 1000, 0);

      diceProgressFill.style.width = `${progress * 100}%`;
      diceTimerCounter.textContent = `${remainingSeconds.toFixed(1)}초`;

      if (elapsed < TOTAL_DURATION) {
        requestAnimationFrame(updateProgress);
      } else {
        // 정확히 2초 도달! 결과 화면으로 전환
        finishDiceRolling();
      }
    }

    requestAnimationFrame(updateProgress);
  }

  // 2초 경과 후 주사위 모달 닫기 및 결과 화면 노출
  function finishDiceRolling() {
    // 1. 학생 명단 무작위 셔플 (Fisher-Yates)
    const shuffledStudents = [...students];
    for (let i = shuffledStudents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledStudents[i], shuffledStudents[j]] = [shuffledStudents[j], shuffledStudents[i]];
    }

    // 2. 1:1 매칭 구성
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

    // 학생 수가 역할 수보다 많은 경우 공동 역할 배정
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

    // 3. 주사위 오버레이 닫기
    diceOverlay.classList.add('hidden');

    // 4. 배정 완료 효과음 (축하 팡파르 차임벨)
    playCelebrationFanfare();

    // 5. 결과 화면 노출 및 카드 렌더링
    emptyPlaceholder.classList.add('hidden');
    cardsGrid.classList.remove('hidden');
    renderCards(true);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    assignedTimestamp.textContent = `배정 완료 시각: ${timeStr}`;

    statStatusBadge.textContent = '배정 완료';
    statStatusBadge.className = 'stat-status assigned';
    btnReshuffle.disabled = false;
    btnCopyResult.disabled = false;

    isRolling = false;
    btnAssign.disabled = false;

    showToast('🎉 2초 주사위 롤링 완료! 우리 반 1인 1역할이 배정되었습니다!');
  }

  // 역할 명칭에 어울리는 이모지 매핑
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

      card.addEventListener('click', () => {
        openSwapModal(index);
      });

      fragment.appendChild(card);
    });

    cardsGrid.appendChild(fragment);
  }

  // --- 학생 변경 (맞교환) 모달 ---
  function openSwapModal(index) {
    currentSwapRoleIndex = index;
    const targetAssignment = assignments[index];
    if (!targetAssignment) return;

    swapRoleTitleText.textContent = `[${targetAssignment.roleTitle}]`;

    swapStudentSelect.innerHTML = '';
    students.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
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

    const otherAssignment = assignments.find(a => a.studentName === selectedStudent);
    if (otherAssignment) {
      otherAssignment.studentName = previousStudent;
      targetAssignment.studentName = selectedStudent;
      showToast(`🔄 [${targetAssignment.roleTitle}] ${selectedStudent}님과 [${otherAssignment.roleTitle}] ${previousStudent}님의 역할이 맞교환되었습니다.`);
    } else {
      targetAssignment.studentName = selectedStudent;
      showToast(`✅ [${targetAssignment.roleTitle}] 담당자가 ${selectedStudent} 학생으로 변경되었습니다.`);
    }

    playDiceClick(0, 1.4);
    saveData();
    renderCards(false);
    closeSwapModal();
  }

  // --- 결과 텍스트 복사 ---
  function copyResultsToClipboard() {
    if (!assignments || assignments.length === 0) {
      showToast('⚠️ 먼저 역할을 배정해주세요.');
      return;
    }

    const currentClass = inputClassTitle.value.trim() || '우리 반';
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;

    let text = `🚀 [${currentClass} 1인 1역할 배정표] (${dateStr})\n`;
    text += `------------------------------------\n`;
    assignments.forEach((item, idx) => {
      text += `${idx + 1}. ${item.studentName} : ${item.roleTitle} ${item.roleIcon} (${item.roleDesc})\n`;
    });
    text += `------------------------------------\n`;
    text += `무한한 공간 저 너머로! 모두 책임감 있게 역할을 실천해요! ✨`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 배정 결과가 클립보드에 복사되었습니다! (알림장에 붙여넣기)');
    }).catch(() => {
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
      const confirmAutoAssign = confirm('아직 역할이 배정되지 않았습니다. 자동으로 1인 1역할을 배정하고 인쇄하시겠습니까?');
      if (confirmAutoAssign) {
        assignRolesWithDiceAnimation();
        setTimeout(() => {
          updatePrintDate();
          window.print();
        }, 2200);
      }
      return;
    }

    updatePrintDate();
    window.print();
  }

  // --- 관리 패널 적용 ---
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

  // --- 구글 시트 모달 연동 ---
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
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`서버 응답 오류 (HTTP ${response.status})`);
      const data = await response.json();

      if (data && data.students && data.students.length > 0) students = data.students;
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
      setSheetStatus(`❌ 시트 불러오기 실패: ${err.message}. (배포 권한이 '모든 사용자'로 설정되어 있는지 확인해주세요)`, 'error');
    }
  }

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
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setSheetStatus(`✅ 배정 결과 ${payload.assignments.length}건이 구글 스프레드시트에 안전하게 저장되었습니다!`, 'success');
      showToast('💾 구글 시트에 배정 결과가 저장되었습니다.');
    } catch (err) {
      setSheetStatus(`❌ 시트 저장 실패: ${err.message}. Apps Script 설정을 확인하세요.`, 'error');
    }
  }

  function setSheetStatus(text, type) {
    sheetStatusMessage.textContent = text;
    sheetStatusMessage.className = `sheet-status ${type}`;
    sheetStatusMessage.classList.remove('hidden');
  }

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
    // 2초 3D 주사위 회전 & 효과음 실행
    btnAssign.addEventListener('click', assignRolesWithDiceAnimation);
    btnPlaceholderAssign.addEventListener('click', assignRolesWithDiceAnimation);
    btnReshuffle.addEventListener('click', assignRolesWithDiceAnimation);

    btnToggleSound.addEventListener('click', toggleSound);
    btnCopyResult.addEventListener('click', copyResultsToClipboard);
    btnPrint.addEventListener('click', triggerPrint);

    inputClassTitle.addEventListener('input', () => {
      syncUIWithData();
      saveData();
    });

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

    btnOpenSheetLoad.addEventListener('click', () => openSheetModal('load'));
    btnOpenSheetSave.addEventListener('click', () => openSheetModal('save'));
    btnCloseSheetModal.addEventListener('click', closeSheetModal);
    btnSaveGasUrl.addEventListener('click', saveGasUrl);
    btnExecuteSheetLoad.addEventListener('click', executeSheetLoad);
    btnExecuteSheetSave.addEventListener('click', executeSheetSave);

    sheetModal.addEventListener('click', (e) => {
      if (e.target === sheetModal) closeSheetModal();
    });
    swapModal.addEventListener('click', (e) => {
      if (e.target === swapModal) closeSwapModal();
    });

    btnCloseSwapModal.addEventListener('click', closeSwapModal);
    btnCancelSwap.addEventListener('click', closeSwapModal);
    btnConfirmSwap.addEventListener('click', applyStudentSwap);

    btnCopyGasCode.addEventListener('click', () => {
      const code = gasCodeSnippet.textContent;
      navigator.clipboard.writeText(code).then(() => {
        showToast('📋 Apps Script 코드가 복사되었습니다.');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!sheetModal.classList.contains('hidden')) closeSheetModal();
        if (!swapModal.classList.contains('hidden')) closeSwapModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
