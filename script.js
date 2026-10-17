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

  // BGM (You've Got a Friend in Me) 상태 관리
  let isBgmPlaying = true;
  let bgmVolume = 0.25;
  let bgmMasterGain = null;
  let bgmLoopTimer = null;
  let isBgmStarted = false;

  // 로컬 스토리지 키
  const STORAGE_KEY_STUDENTS = 'school_role_students_v1';
  const STORAGE_KEY_ROLES = 'school_role_roles_v1';
  const STORAGE_KEY_ASSIGNMENTS = 'school_role_assignments_v1';
  const STORAGE_KEY_CLASS_NAME = 'school_role_class_name_v1';
  const STORAGE_KEY_GAS_URL = 'school_role_gas_url_v1';
  const STORAGE_KEY_SOUND = 'school_role_sound_v1';
  const STORAGE_KEY_BGM = 'school_role_bgm_v1';
  const STORAGE_KEY_BGM_VOL = 'school_role_bgm_vol_v1';

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
  const btnPrint = document.getElementById('btnPrint');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  // BGM 플레이어 DOM
  const btnToggleBgm = document.getElementById('btnToggleBgm');
  const bgmIcon = document.getElementById('bgmIcon');
  const bgmText = document.getElementById('bgmText');
  const vinylRecord = document.getElementById('vinylRecord');
  const btnPlayPauseBgm = document.getElementById('btnPlayPauseBgm');
  const bgmActionIcon = document.getElementById('bgmActionIcon');
  const bgmActionLabel = document.getElementById('bgmActionLabel');
  const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');

  // 3D 주사위 오버레이
  const diceOverlay = document.getElementById('diceOverlay');
  const diceProgressFill = document.getElementById('diceProgressFill');
  const diceTimerCounter = document.getElementById('diceTimerCounter');

  // 학생 명단 & 역할·업무 내용 수정 모달 DOM
  const btnOpenEditModal = document.getElementById('btnOpenEditModal');
  const dataEditModal = document.getElementById('dataEditModal');
  const btnCloseEditModal = document.getElementById('btnCloseEditModal');
  const btnCancelEditModal = document.getElementById('btnCancelEditModal');
  const btnSaveAndApplyModal = document.getElementById('btnSaveAndApplyModal');
  const btnResetToDefaultsModal = document.getElementById('btnResetToDefaultsModal');

  const tabBtnStudents = document.getElementById('tabBtnStudents');
  const tabBtnRoles = document.getElementById('tabBtnRoles');
  const editTabStudentsContent = document.getElementById('editTabStudentsContent');
  const editTabRolesContent = document.getElementById('editTabRolesContent');
  const editModalStudentCount = document.getElementById('editModalStudentCount');
  const editModalRoleCount = document.getElementById('editModalRoleCount');

  const studentRowsContainer = document.getElementById('studentRowsContainer');
  const btnAddStudentRow = document.getElementById('btnAddStudentRow');
  const roleRowsContainer = document.getElementById('roleRowsContainer');
  const btnAddRoleRow = document.getElementById('btnAddRoleRow');

  // 모달 임시 작업 버퍼
  let draftStudents = [];
  let draftRoles = [];
  let currentEditTab = 'students';

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

  // --- Web Audio API 사운드 및 토이스토리 OST BGM 생성기 ---
  let audioCtx = null;

  // 음계 주파수 정의 (Randy Newman Ragtime Piano & Bass)
  const NOTE_FREQ = {
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'Ab2': 103.83, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'Ab5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
    'C6': 1046.50
  };

  // 토이스토리 OST "You've Got a Friend in Me" 풀 시퀀스 악보 데이터 (스윙 랙타임)
  const THEME_SCORE = [
    // --- Intro 랙타임 인트로 리프 ---
    { m: ['G4', 0.5], b: 'C3', c: ['E4', 'G4', 'C5'], t: 0 },
    { m: ['A4', 0.5], t: 0.5 },
    { m: ['C5', 0.6], b: 'G2', c: ['E4', 'G4', 'C5'], t: 1.0 },
    { m: ['D5', 0.4], t: 1.6 },
    { m: ['Eb5', 0.3], t: 2.0 },
    { m: ['E5', 0.8], b: 'C3', c: ['E4', 'G4', 'C5'], t: 2.3 },
    { m: ['C5', 0.6], b: 'E3', c: ['D4', 'G#4', 'B4'], t: 3.2 },
    { m: ['A4', 0.5], t: 3.8 },
    { m: ['G4', 0.6], b: 'A2', c: ['C4', 'E4', 'A4'], t: 4.3 },
    { m: ['E4', 0.6], t: 4.9 },
    { m: ['G4', 0.5], b: 'Ab2', c: ['C4', 'Eb4', 'Gb4'], t: 5.5 },
    { m: ['A4', 0.5], t: 6.0 },
    { m: ['Ab4', 0.9], b: 'G2', c: ['C4', 'E4', 'G4'], t: 6.5 },
    { m: ['G4', 0.6], b: 'G2', c: ['B3', 'D4', 'F4'], t: 7.4 },
    { m: ['C5', 1.0], b: 'C3', c: ['C4', 'E4', 'G4'], t: 8.0 },

    // --- Verse 1: "You've got a friend in me" ---
    { m: ['C4', 0.4], b: 'C3', c: ['E4', 'G4'], t: 9.2 },
    { m: ['E4', 0.4], t: 9.6 },
    { m: ['G4', 0.4], b: 'G2', c: ['E4', 'C5'], t: 10.0 },
    { m: ['A4', 0.4], t: 10.4 },
    { m: ['C5', 1.2], b: 'C3', c: ['E4', 'G4', 'C5'], t: 10.8 },
    { m: ['A4', 0.4], t: 12.0 },
    { m: ['C5', 0.8], b: 'E3', c: ['D4', 'G#4', 'B4'], t: 12.4 },
    { m: ['C5', 0.5], b: 'A2', c: ['C4', 'E4', 'A4'], t: 13.2 },
    { m: ['A4', 0.7], t: 13.7 },

    // --- "You've got a friend in me" ---
    { m: ['C4', 0.4], b: 'Ab2', c: ['C4', 'Eb4', 'Ab4'], t: 14.5 },
    { m: ['E4', 0.4], t: 14.9 },
    { m: ['G4', 0.4], b: 'G2', c: ['C4', 'E4', 'G4'], t: 15.3 },
    { m: ['A4', 0.4], t: 15.7 },
    { m: ['C5', 1.2], b: 'C3', c: ['E4', 'G4', 'C5'], t: 16.1 },
    { m: ['A4', 0.8], t: 17.3 },
    { m: ['G4', 0.5], b: 'G2', c: ['B3', 'D4', 'F4'], t: 18.1 },
    { m: ['E4', 0.5], t: 18.6 },
    { m: ['D4', 0.9], b: 'C3', c: ['C4', 'E4', 'G4'], t: 19.1 },

    // --- "When the road looks rough ahead" ---
    { m: ['E5', 0.5], b: 'F2', c: ['A3', 'C4', 'F4'], t: 20.2 },
    { m: ['E5', 0.4], t: 20.7 },
    { m: ['D5', 0.4], b: 'F#2', c: ['A3', 'C4', 'Eb4'], t: 21.1 },
    { m: ['C5', 0.4], t: 21.5 },
    { m: ['D5', 0.5], b: 'G2', c: ['C4', 'E4', 'G4'], t: 21.9 },
    { m: ['E5', 0.5], t: 22.4 },
    { m: ['C5', 0.9], b: 'E2', c: ['D4', 'G#4', 'B4'], t: 22.9 },

    // --- "And you're miles and miles from your nice warm bed" ---
    { m: ['E5', 0.5], b: 'A2', c: ['C4', 'E4', 'A4'], t: 23.8 },
    { m: ['E5', 0.4], t: 24.3 },
    { m: ['D5', 0.4], b: 'G2', c: ['B3', 'D4', 'F4'], t: 24.7 },
    { m: ['C5', 0.4], t: 25.1 },
    { m: ['D5', 0.4], b: 'F2', c: ['A3', 'C4', 'F4'], t: 25.5 },
    { m: ['E5', 0.4], t: 25.9 },
    { m: ['D5', 0.4], b: 'E2', c: ['G#3', 'B3', 'E4'], t: 26.3 },
    { m: ['C5', 0.4], t: 26.7 },
    { m: ['A4', 0.9], b: 'A2', c: ['C4', 'E4', 'A4'], t: 27.1 },

    // --- "You just remember what your old pal said" ---
    { m: ['C5', 0.4], b: 'D3', c: ['C4', 'F#4', 'A4'], t: 28.1 },
    { m: ['C5', 0.4], t: 28.5 },
    { m: ['A4', 0.35], b: 'F#2', c: ['C4', 'D4', 'A4'], t: 28.9 },
    { m: ['C5', 0.35], t: 29.25 },
    { m: ['D5', 0.35], b: 'G2', c: ['B3', 'D4', 'G4'], t: 29.6 },
    { m: ['Eb5', 0.3], t: 29.95 },
    { m: ['E5', 0.7], b: 'B2', c: ['D4', 'F4', 'G4'], t: 30.25 },
    { m: ['C5', 0.6], t: 30.95 },

    // --- "Boy, you've got a friend in me" ---
    { m: ['A4', 0.45], b: 'C3', c: ['E4', 'G4', 'C5'], t: 31.6 },
    { m: ['G4', 0.45], t: 32.05 },
    { m: ['E4', 0.35], b: 'A2', c: ['C#4', 'G4', 'A4'], t: 32.5 },
    { m: ['G4', 0.35], t: 32.85 },
    { m: ['A4', 0.55], b: 'D3', c: ['C4', 'F#4', 'A4'], t: 33.2 },
    { m: ['C5', 1.4], b: 'G2', c: ['B3', 'D4', 'F4'], t: 33.75 },

    // --- "Yeah, you've got a friend in me" ---
    { m: ['A4', 0.45], b: 'C3', c: ['E4', 'G4', 'C5'], t: 35.3 },
    { m: ['G4', 0.45], t: 35.75 },
    { m: ['E4', 0.45], b: 'B2', c: ['D4', 'G#4', 'B4'], t: 36.2 },
    { m: ['D4', 0.45], b: 'A2', c: ['C4', 'E4', 'A4'], t: 36.65 },
    { m: ['C4', 1.9], b: 'Ab2', c: ['C4', 'Eb4', 'Ab4'], t: 37.1 },

    // --- Turnaround 마무리 ---
    { m: ['G4', 0.35], b: 'G2', c: ['B3', 'D4', 'F4'], t: 39.2 },
    { m: ['A4', 0.35], t: 39.55 },
    { m: ['C5', 0.35], b: 'C3', c: ['C4', 'E4', 'G4'], t: 39.9 },
    { m: ['D5', 0.35], t: 40.25 },
    { m: ['C5', 1.2], b: 'C3', c: ['C4', 'E4', 'G4'], t: 40.6 }
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx) {
      if (!bgmMasterGain) {
        bgmMasterGain = audioCtx.createGain();
        bgmMasterGain.gain.setValueAtTime(isBgmPlaying ? bgmVolume : 0, audioCtx.currentTime);
        bgmMasterGain.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
    return audioCtx;
  }

  // --- 토이스토리 OST 악기 합성기 ---
  // 1. 따뜻한 랙타임 어쿠스틱 피아노 멜로디
  function playMelodyNote(ctx, freq, startTime, duration) {
    if (!freq) return;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 1.15);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(bgmMasterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration * 1.2);
    osc2.stop(startTime + duration * 1.2);
  }

  // 2. 워킹 어쿠스틱 업라이트 베이스
  function playBassNote(ctx, freq, startTime, duration) {
    if (!freq) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.04, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.035);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.min(duration, 0.7));

    osc.connect(gain);
    gain.connect(bgmMasterGain);

    osc.start(startTime);
    osc.stop(startTime + Math.min(duration, 0.75));
  }

  // 3. 소프트 스윙 오프비트 화음 (로즈 피아노 코드)
  function playChord(ctx, notes, startTime, duration) {
    if (!notes || notes.length === 0) return;
    notes.forEach(note => {
      const freq = NOTE_FREQ[note];
      if (!freq) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.065, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.min(duration, 0.65));

      osc.connect(gain);
      gain.connect(bgmMasterGain);

      osc.start(startTime);
      osc.stop(startTime + Math.min(duration, 0.7));
    });
  }

  // BGM 무한 연속 루프 스케줄러
  function scheduleBgmLoop() {
    if (!isBgmPlaying) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + 0.05;
    const BEAT_SEC = 0.52;

    THEME_SCORE.forEach(item => {
      const noteTime = startTime + (item.t * BEAT_SEC);
      if (item.m) {
        const freq = NOTE_FREQ[item.m[0]];
        playMelodyNote(ctx, freq, noteTime, item.m[1] * BEAT_SEC);
      }
      if (item.b) {
        const freq = NOTE_FREQ[item.b];
        playBassNote(ctx, freq, noteTime, 0.6 * BEAT_SEC);
      }
      if (item.c) {
        playChord(ctx, item.c, noteTime, 0.6 * BEAT_SEC);
      }
    });

    const totalDurationMs = (42.2 * BEAT_SEC) * 1000;
    bgmLoopTimer = setTimeout(() => {
      if (isBgmPlaying) {
        scheduleBgmLoop();
      }
    }, totalDurationMs);
  }

  // BGM 재생 시작
  function startBgm() {
    isBgmPlaying = true;
    localStorage.setItem(STORAGE_KEY_BGM, 'true');
    const ctx = getAudioContext();
    if (ctx && bgmMasterGain) {
      const now = ctx.currentTime;
      bgmMasterGain.gain.cancelScheduledValues(now);
      bgmMasterGain.gain.linearRampToValueAtTime(bgmVolume, now + 0.15);
    }
    if (bgmLoopTimer) clearTimeout(bgmLoopTimer);
    scheduleBgmLoop();
    updateBgmUI();
  }

  // BGM 일시정지
  function pauseBgm() {
    isBgmPlaying = false;
    localStorage.setItem(STORAGE_KEY_BGM, 'false');
    if (bgmMasterGain && audioCtx) {
      const now = audioCtx.currentTime;
      bgmMasterGain.gain.cancelScheduledValues(now);
      bgmMasterGain.gain.linearRampToValueAtTime(0, now + 0.15);
    }
    if (bgmLoopTimer) {
      clearTimeout(bgmLoopTimer);
      bgmLoopTimer = null;
    }
    updateBgmUI();
  }

  // BGM 토글
  function toggleBgm() {
    if (isBgmPlaying) {
      pauseBgm();
      showToast('⏸️ 배경음악(OST)이 일시정지되었습니다.');
    } else {
      startBgm();
      showToast('🎵 토이스토리 OST "You\'ve Got a Friend in Me" 재생 시작!');
    }
  }

  // BGM 볼륨 조정
  function setBgmVolume(val) {
    bgmVolume = parseFloat(val);
    localStorage.setItem(STORAGE_KEY_BGM_VOL, bgmVolume.toString());
    if (bgmMasterGain && audioCtx && isBgmPlaying) {
      const now = audioCtx.currentTime;
      bgmMasterGain.gain.cancelScheduledValues(now);
      bgmMasterGain.gain.setValueAtTime(bgmVolume, now);
    }
  }

  // 주사위 롤링 시 효과음이 잘 들리도록 BGM 볼륨 일시 감쇠(Ducking)
  function duckBgm(isDucking) {
    if (!bgmMasterGain || !audioCtx) return;
    const now = audioCtx.currentTime;
    if (isDucking) {
      bgmMasterGain.gain.cancelScheduledValues(now);
      bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
      bgmMasterGain.gain.linearRampToValueAtTime(bgmVolume * 0.15, now + 0.2);
    } else {
      bgmMasterGain.gain.cancelScheduledValues(now);
      bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
      bgmMasterGain.gain.linearRampToValueAtTime(isBgmPlaying ? bgmVolume : 0, now + 0.35);
    }
  }

  // BGM UI 동기화
  function updateBgmUI() {
    if (isBgmPlaying) {
      btnToggleBgm.classList.remove('paused');
      bgmText.textContent = 'BGM ON';
      bgmIcon.textContent = '🎵';
      vinylRecord.classList.add('spinning');
      bgmActionIcon.textContent = '⏸️';
      bgmActionLabel.textContent = '일시정지';
    } else {
      btnToggleBgm.classList.add('paused');
      bgmText.textContent = 'BGM OFF';
      bgmIcon.textContent = '🔇';
      vinylRecord.classList.remove('spinning');
      bgmActionIcon.textContent = '▶️';
      bgmActionLabel.textContent = '재생하기';
    }
    bgmVolumeSlider.value = bgmVolume;
  }

  // --- 효과음 (주사위 딸깍거림 & 팡파르) ---
  function playDiceClick(timeOffset = 0, pitchVariation = 1.0) {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + timeOffset;

    const bufferSize = ctx.sampleRate * 0.035;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

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

  function playRollingDiceAudio(durationSeconds = 2.0) {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    let currentOffset = 0;
    const totalHits = 20;

    for (let i = 0; i < totalHits; i++) {
      const interval = 0.06 + Math.random() * 0.07;
      currentOffset += interval;
      if (currentOffset >= durationSeconds - 0.1) break;

      const pitch = 0.8 + Math.random() * 0.6;
      playDiceClick(currentOffset, pitch);
    }
  }

  function playCelebrationFanfare() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
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
    updateBgmUI();
  }

  // 시트/브라우저 저장 데이터의 다양한 학생 형식을 이름 문자열로 통일
  function normalizeStudentName(student) {
    if (typeof student === 'string' || typeof student === 'number') {
      const name = String(student).trim();
      return (!name || ['[object Object]', 'undefined', 'null', 'NaN'].includes(name)) ? '' : name;
    }
    if (student && typeof student === 'object') {
      const fields = ['name', 'studentName', 'student', '학생이름', '이름', 'value', '성명'];
      for (const field of fields) {
        const value = student[field];
        if (typeof value === 'string' || typeof value === 'number') {
          const name = String(value).trim();
          if (name && !['[object Object]', 'undefined', 'null', 'NaN'].includes(name)) return name;
        }
      }
    }
    return '';
  }

  function normalizeRole(role) {
    if (typeof role === 'string') {
      const title = role.trim();
      return title && title !== 'undefined' ? { title, desc: '', icon: getRoleEmoji(title) } : null;
    }
    if (!role || typeof role !== 'object') return null;
    const title = [role.title, role.roleTitle, role.role, role['역할'], role['역할명'], role['이름'], role.name]
      .find(v => typeof v === 'string' && v.trim() && !['undefined', 'null', '[object Object]'].includes(v.trim()));
    if (!title) return null;
    const desc = [role.desc, role.description, role.roleDesc, role['업무'], role['설명']]
      .find(v => typeof v === 'string' && !['undefined', 'null'].includes(v.trim())) || '';
    return { title: title.trim(), desc, icon: role.icon || getRoleEmoji(title) };
  }

  // --- 데이터 불러오기 ---
  function loadSavedData() {
    const savedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
    const savedRoles = localStorage.getItem(STORAGE_KEY_ROLES);
    const savedAssignments = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    const savedClassName = localStorage.getItem(STORAGE_KEY_CLASS_NAME);
    const savedGasUrl = localStorage.getItem(STORAGE_KEY_GAS_URL);
    const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);
    const savedBgm = localStorage.getItem(STORAGE_KEY_BGM);
    const savedBgmVol = localStorage.getItem(STORAGE_KEY_BGM_VOL);

    try {
      const parsedStudents = savedStudents ? JSON.parse(savedStudents) : DEFAULT_STUDENTS;
      students = (Array.isArray(parsedStudents) ? parsedStudents : DEFAULT_STUDENTS)
        .map(normalizeStudentName).filter(Boolean);
    } catch (e) {
      students = [...DEFAULT_STUDENTS];
    }
    try {
      const parsedRoles = savedRoles ? JSON.parse(savedRoles) : DEFAULT_ROLES;
      roles = (Array.isArray(parsedRoles) ? parsedRoles : DEFAULT_ROLES).map(normalizeRole).filter(Boolean);
    } catch (e) {
      roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    }

    if (savedClassName) {
      inputClassTitle.value = savedClassName;
    }

    if (savedGasUrl) {
      gasUrlInput.value = savedGasUrl;
    }

    if (savedSound !== null) {
      isSoundEnabled = savedSound === 'true';
    }

    if (savedBgm !== null) {
      isBgmPlaying = savedBgm === 'true';
    }

    if (savedBgmVol !== null) {
      bgmVolume = parseFloat(savedBgmVol);
    }

    if (savedAssignments) {
      try {
        const parsedAssignments = JSON.parse(savedAssignments);
        assignments = Array.isArray(parsedAssignments) ? parsedAssignments.filter(a => a && typeof a === 'object').map(a => ({ ...a, studentName: normalizeStudentName(a.studentName ?? a.student ?? a.name) })).filter(a => a.studentName) : [];
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
    if (manageCountPreview) {
      manageCountPreview.textContent = `${students.length}`;
    }
    if (editModalStudentCount) {
      editModalStudentCount.textContent = `${students.length}`;
    }
    if (editModalRoleCount) {
      editModalRoleCount.textContent = `${roles.length}`;
    }

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

    // 주사위 롤링 시 BGM 볼륨 부드럽게 감쇠하여 효과음 부각
    duckBgm(true);

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

    // BGM 볼륨 원래대로 복원
    duckBgm(false);

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

    showToast('🎉 우리 반 1인 1역할이 멋지게 배정되었습니다!');
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
          <span class="card-icon">${item.roleIcon || '🤝'}</span>
          <button class="card-swap-btn no-print" data-index="${index}" title="담당 학생 바꾸기">
            학생 변경
          </button>
        </div>
        <div class="card-role-title">
          <span>${item.roleTitle || '역할 미지정'}</span>
        </div>
        <div class="student-badge-box">
          <span class="student-label">담당 학생</span>
          <span class="student-name">${normalizeStudentName(item.studentName) || '담당 학생 미지정'}</span>
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

  // ==========================================================================
  // 학생 명단 & 역할·업무 내용 수정 모달 관리 로직
  // (화면상에 상시 노출되지 않고, 버튼 클릭 시 팝업되어 수정 후 '완료' 시 배정 적용)
  // ==========================================================================

  function openEditModal(initialTab = 'students') {
    draftStudents = [...students];
    draftRoles = roles.map(r => ({
      title: r.title,
      desc: r.desc || '',
      icon: r.icon || getRoleEmoji(r.title)
    }));

    switchEditTab(initialTab);
    renderEditStudentRows();
    renderEditRoleRows();
    updateEditModalCounts();

    dataEditModal.classList.remove('hidden');

    // 첫 번째 입력 필드로 포커스 이동
    setTimeout(() => {
      if (initialTab === 'students') {
        const firstInput = studentRowsContainer.querySelector('input');
        if (firstInput) firstInput.focus();
      } else {
        const firstInput = roleRowsContainer.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }, 80);
  }

  function closeEditModal() {
    dataEditModal.classList.add('hidden');
  }

  function switchEditTab(tab) {
    currentEditTab = tab;
    if (tab === 'students') {
      tabBtnStudents.classList.add('active');
      tabBtnRoles.classList.remove('active');
      editTabStudentsContent.classList.remove('hidden');
      editTabRolesContent.classList.add('hidden');
    } else {
      tabBtnRoles.classList.add('active');
      tabBtnStudents.classList.remove('active');
      editTabRolesContent.classList.remove('hidden');
      editTabStudentsContent.classList.add('hidden');
    }
  }

  function updateEditModalCounts() {
    if (editModalStudentCount) {
      editModalStudentCount.textContent = draftStudents.length;
    }
    if (editModalRoleCount) {
      editModalRoleCount.textContent = draftRoles.length;
    }
  }

  function renderEditStudentRows() {
    studentRowsContainer.innerHTML = '';

    if (draftStudents.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.padding = '20px';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.color = '#94a3b8';
      emptyDiv.innerHTML = `등록된 학생이 없습니다. 아래 <strong>'+ 학생 1명 추가'</strong> 버튼을 눌러보세요!`;
      studentRowsContainer.appendChild(emptyDiv);
      return;
    }

    draftStudents.forEach((name, index) => {
      const row = document.createElement('div');
      row.className = 'edit-student-row';

      const idxBadge = document.createElement('span');
      idxBadge.className = 'row-index';
      idxBadge.textContent = index + 1;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'edit-input-student';
      input.value = normalizeStudentName(name);
      input.placeholder = `학생 ${index + 1} 이름`;
      input.addEventListener('input', (e) => {
        draftStudents[index] = e.target.value;
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-del-row';
      delBtn.title = '이 학생 삭제';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        draftStudents.splice(index, 1);
        renderEditStudentRows();
        updateEditModalCounts();
      });

      row.appendChild(idxBadge);
      row.appendChild(input);
      row.appendChild(delBtn);

      studentRowsContainer.appendChild(row);
    });
  }

  function renderEditRoleRows() {
    roleRowsContainer.innerHTML = '';

    if (draftRoles.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.padding = '20px';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.color = '#94a3b8';
      emptyDiv.innerHTML = `등록된 역할이 없습니다. 아래 <strong>'+ 새 역할 추가'</strong> 버튼을 눌러보세요!`;
      roleRowsContainer.appendChild(emptyDiv);
      return;
    }

    draftRoles.forEach((role, index) => {
      const row = document.createElement('div');
      row.className = 'edit-role-row';

      const idxBadge = document.createElement('span');
      idxBadge.className = 'row-index';
      idxBadge.textContent = index + 1;

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'edit-role-emoji';
      emojiSpan.textContent = role.icon || getRoleEmoji(role.title);

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'edit-input-role-title';
      titleInput.value = role.title;
      titleInput.placeholder = '역할 이름 (예: 칠판 도우미)';
      titleInput.addEventListener('input', (e) => {
        draftRoles[index].title = e.target.value;
        const icon = getRoleEmoji(e.target.value);
        draftRoles[index].icon = icon;
        emojiSpan.textContent = icon;
      });

      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.className = 'edit-input-role-desc';
      descInput.value = role.desc || '';
      descInput.placeholder = '업무 및 실천 내용 (예: 칠판 깨끗하게 닦기)';
      descInput.addEventListener('input', (e) => {
        draftRoles[index].desc = e.target.value;
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-del-row';
      delBtn.title = '이 역할 삭제';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        draftRoles.splice(index, 1);
        renderEditRoleRows();
        updateEditModalCounts();
      });

      row.appendChild(idxBadge);
      row.appendChild(emojiSpan);
      row.appendChild(titleInput);
      row.appendChild(descInput);
      row.appendChild(delBtn);

      roleRowsContainer.appendChild(row);
    });
  }

  function addStudentRow() {
    draftStudents.push('');
    renderEditStudentRows();
    updateEditModalCounts();

    const inputs = studentRowsContainer.querySelectorAll('input');
    if (inputs.length > 0) {
      const lastInput = inputs[inputs.length - 1];
      lastInput.focus();
      lastInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function addRoleRow() {
    draftRoles.push({
      title: '',
      desc: '',
      icon: '⭐'
    });
    renderEditRoleRows();
    updateEditModalCounts();

    const titleInputs = roleRowsContainer.querySelectorAll('.edit-input-role-title');
    if (titleInputs.length > 0) {
      const lastInput = titleInputs[titleInputs.length - 1];
      lastInput.focus();
      lastInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function resetDefaultsInModal() {
    if (confirm('기본 12명 학생 및 12개 역할 데이터로 되돌리시겠습니까?')) {
      draftStudents = [...DEFAULT_STUDENTS];
      draftRoles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
      renderEditStudentRows();
      renderEditRoleRows();
      updateEditModalCounts();
      showToast('🔄 기본 12명 데이터가 채워졌습니다. 완료를 누르면 배정에 적용됩니다.');
    }
  }

  function saveAndApplyFromModal() {
    // 실시간 DOM 입력값 최종 수집 (한글 IME 완성 대응)
    const studentInputs = studentRowsContainer.querySelectorAll('.edit-input-student');
    const roleTitleInputs = roleRowsContainer.querySelectorAll('.edit-input-role-title');
    const roleDescInputs = roleRowsContainer.querySelectorAll('.edit-input-role-desc');

    const finalStudents = [];
    studentInputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) finalStudents.push(val);
    });

    const finalRoles = [];
    roleTitleInputs.forEach((inp, idx) => {
      const title = inp.value.trim();
      if (title) {
        const desc = roleDescInputs[idx] ? roleDescInputs[idx].value.trim() : '';
        finalRoles.push({
          title: title,
          desc: desc,
          icon: getRoleEmoji(title)
        });
      }
    });

    if (finalStudents.length === 0) {
      showToast('⚠️ 학생 이름을 1명 이상 입력해주세요.');
      switchEditTab('students');
      return;
    }

    if (finalRoles.length === 0) {
      showToast('⚠️ 역할 이름을 1개 이상 입력해주세요.');
      switchEditTab('roles');
      return;
    }

    students = finalStudents;
    roles = finalRoles;

    // 만약 이미 배정된 카드가 있다면, 수정된 역할/설명/학생을 가능한 범위 내에서 동기화 업데이트
    if (assignments && assignments.length > 0) {
      assignments.forEach((assign, idx) => {
        if (roles[idx]) {
          assign.roleTitle = roles[idx].title;
          assign.roleDesc = roles[idx].desc;
          assign.roleIcon = roles[idx].icon;
        }
      });
      if (assignments.length > students.length || assignments.length > roles.length) {
        assignments = assignments.filter(a => students.includes(a.studentName));
      }
    }

    saveData();
    syncUIWithData();
    closeEditModal();

    playCelebrationFanfare();
    showToast(`✅ 학생 ${students.length}명과 역할 ${roles.length}개가 실제 역할 배정에 반영되었습니다!`);
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

      if (data && Array.isArray(data.students) && data.students.length > 0) {
        const normalizedStudents = data.students.map(normalizeStudentName).filter(Boolean);
        if (!normalizedStudents.length) throw new Error('학생 이름을 찾을 수 없습니다. 시트의 이름 열과 Apps Script 응답을 확인해주세요');
        students = normalizedStudents;
        // 기존 배정 결과에는 이전 학생 이름이 남을 수 있으므로 명단 변경 시 초기화
        if (assignments.length && assignments.some(a => !students.includes(a.studentName))) assignments = [];
      }
      if (data && Array.isArray(data.roles) && data.roles.length > 0) {
        const normalizedRoles = data.roles.map(normalizeRole).filter(Boolean);
        if (!normalizedRoles.length) throw new Error('시트에서 역할명을 찾을 수 없습니다. 역할 열 제목을 확인해주세요');
        roles = normalizedRoles;
        assignments = [];
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

    // 학생·역할 수정 전용 모달 이벤트
    btnOpenEditModal.addEventListener('click', () => openEditModal('students'));
    btnCloseEditModal.addEventListener('click', closeEditModal);
    btnCancelEditModal.addEventListener('click', closeEditModal);
    btnSaveAndApplyModal.addEventListener('click', saveAndApplyFromModal);
    btnResetToDefaultsModal.addEventListener('click', resetDefaultsInModal);

    tabBtnStudents.addEventListener('click', () => switchEditTab('students'));
    tabBtnRoles.addEventListener('click', () => switchEditTab('roles'));
    btnAddStudentRow.addEventListener('click', addStudentRow);
    btnAddRoleRow.addEventListener('click', addRoleRow);

    dataEditModal.addEventListener('click', (e) => {
      if (e.target === dataEditModal) closeEditModal();
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

    // 토이스토리 OST BGM 이벤트
    btnToggleBgm.addEventListener('click', toggleBgm);
    btnPlayPauseBgm.addEventListener('click', toggleBgm);
    bgmVolumeSlider.addEventListener('input', (e) => setBgmVolume(e.target.value));

    // 브라우저 자동재생 정책 대응: 첫 사용자 인터랙션 시 BGM 자동 재생 시작
    function enableAudioOnFirstGesture() {
      getAudioContext();
      if (isBgmPlaying && !bgmLoopTimer) {
        startBgm();
      }
      document.removeEventListener('click', enableAudioOnFirstGesture);
      document.removeEventListener('keydown', enableAudioOnFirstGesture);
      document.removeEventListener('touchstart', enableAudioOnFirstGesture);
    }
    document.addEventListener('click', enableAudioOnFirstGesture);
    document.addEventListener('keydown', enableAudioOnFirstGesture);
    document.addEventListener('touchstart', enableAudioOnFirstGesture);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!dataEditModal.classList.contains('hidden')) closeEditModal();
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
