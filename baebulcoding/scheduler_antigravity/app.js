/**
 * Aether Planner - 동적 스케줄러 애플리케이션 로직
 */

// 애플리케이션 상태 관리
const state = {
  today: new Date(2026, 6, 1), // 메타데이터 기준 오늘 날짜 (2026년 7월 1일)
  selectedDate: new Date(2026, 6, 1),
  currentMonth: new Date(2026, 6, 1), // 달력 표시용 기준일 (1일로 세팅)
  schedules: {} // 로컬 스토리지 연동 일정 데이터 (날짜별 일정 배열: { "YYYY-MM-DD": [ { id, time, task, done, result } ] })
};

// DOM 요소 캐싱
const elements = {
  todayDateStr: document.getElementById('todayDateStr'),
  todayDayStr: document.getElementById('todayDayStr'),
  calendarTitle: document.getElementById('calendarTitle'),
  calendarDays: document.getElementById('calendarDays'),
  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  selectedDateTitle: document.getElementById('selectedDateTitle'),
  selectedDateStatus: document.getElementById('selectedDateStatus'),
  goToTodayBtn: document.getElementById('goToTodayBtn'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  timelineList: document.getElementById('timelineList'),
  statsRatio: document.getElementById('statsRatio'),
  progressBar: document.getElementById('progressBar'),
  statsText: document.getElementById('statsText'),
  statsTitle: document.querySelector('.stats-card .card-title'),
  
  // 모달창 관련 엘리먼트
  modalOverlay: document.getElementById('modalOverlay'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  addTaskForm: document.getElementById('addTaskForm'),
  taskTime: document.getElementById('taskTime'),
  taskName: document.getElementById('taskName')
};

// 요일 한글 맵핑
const koDays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/**
 * 앱 구동 시작 함수
 */
function init() {
  // 실제 사용자의 브라우저 클락에 맞춰 오늘 날짜 생성
  const systemDate = new Date();
  if (systemDate.getFullYear() === 2026 && systemDate.getMonth() === 6) {
    state.today = systemDate;
    state.selectedDate = new Date(systemDate);
    state.currentMonth = new Date(systemDate.getFullYear(), systemDate.getMonth(), 1);
  }

  // 좌측 오늘 요약 표시
  updateTodayPanel();

  // 일정 데이터 로드 및 포맷 마이그레이션
  loadSchedules();

  // 이벤트 리스너 등록
  elements.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
  elements.nextMonthBtn.addEventListener('click', () => changeMonth(1));
  elements.goToTodayBtn.addEventListener('click', handleGoToToday);
  
  // 모달 열기/닫기 이벤트 바인딩
  elements.addTaskBtn.addEventListener('click', openAddTaskModal);
  elements.closeModalBtn.addEventListener('click', closeAddTaskModal);
  elements.cancelModalBtn.addEventListener('click', closeAddTaskModal);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeAddTaskModal();
  });
  
  // 모달 폼 전송 이벤트
  elements.addTaskForm.addEventListener('submit', handleAddTaskSubmit);

  // 초기 렌더링
  renderCalendar();
  renderTimeline();
  updateStats();
}

/**
 * 좌측 오늘 날짜 패널 업데이트
 */
function updateTodayPanel() {
  const year = state.today.getFullYear();
  const month = state.today.getMonth() + 1;
  const date = state.today.getDate();
  const dayName = koDays[state.today.getDay()];

  elements.todayDateStr.textContent = `${year}년 ${month}월 ${date}일`;
  elements.todayDayStr.textContent = dayName;
}

/**
 * 날짜 객체를 YYYY-MM-DD 형식의 문자열로 변환
 */
function formatDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 두 날짜가 같은 연/월/일인지 확인
 */
function isSameDate(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * 로컬 스토리지로부터 일정 로드 및 마이그레이션(이전 버전 데이터 변환)
 */
function loadSchedules() {
  const data = localStorage.getItem('aether_schedules');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      
      // 구 버전의 구조(시간을 키값으로 하던 객체 구조)가 존재할 경우, 신 버전(배열 구조)으로 마이그레이션 진행
      let isMigrated = false;
      for (const dateKey in parsed) {
        const val = parsed[dateKey];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          isMigrated = true;
          const migratedArray = [];
          for (const hourStr in val) {
            const hourInt = parseInt(hourStr);
            const item = val[hourStr];
            if (item && item.task && item.task.trim() !== '') {
              const formattedTime = String(hourInt).padStart(2, '0') + ':00';
              migratedArray.push({
                id: Date.now() + Math.random(),
                time: formattedTime,
                task: item.task,
                done: item.done || false,
                result: item.result || ''
              });
            }
          }
          // 시간 기준 오름차순 정렬
          migratedArray.sort((a, b) => a.time.localeCompare(b.time));
          parsed[dateKey] = migratedArray;
        }
      }
      
      state.schedules = parsed;
      if (isMigrated) {
        saveSchedules();
      }
    } catch (e) {
      console.error('스케줄 데이터 파싱 에러, 초기화 진행합니다.', e);
      state.schedules = {};
    }
  } else {
    state.schedules = {};
  }
}

/**
 * 로컬 스토리지에 일정 저장
 */
function saveSchedules() {
  localStorage.setItem('aether_schedules', JSON.stringify(state.schedules));
}

/**
 * 월 이동 처리
 */
function changeMonth(direction) {
  state.currentMonth.setMonth(state.currentMonth.getMonth() + direction);
  renderCalendar();
}

/**
 * '오늘로 이동' 버튼 이벤트 처리
 */
function handleGoToToday() {
  state.selectedDate = new Date(state.today);
  state.currentMonth = new Date(state.today.getFullYear(), state.today.getMonth(), 1);
  renderCalendar();
  renderTimeline();
  updateStats();
}

/**
 * 일정 등록 모달창 활성화
 */
function openAddTaskModal() {
  // 모달을 열 때 기본 시간을 현재 시간으로 프리필(Pre-fill)
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  elements.taskTime.value = `${currentHour}:${currentMinute}`;
  
  elements.taskName.value = '';
  
  elements.modalOverlay.classList.add('active');
  
  // 모달창 인풋에 바로 오토 포커스
  setTimeout(() => {
    elements.taskName.focus();
  }, 100);
}

/**
 * 일정 등록 모달창 닫기
 */
function closeAddTaskModal() {
  elements.modalOverlay.classList.remove('active');
}

/**
 * 일정 등록 양식(Form) 제출 처리
 */
function handleAddTaskSubmit(e) {
  e.preventDefault();
  
  const timeVal = elements.taskTime.value;
  const nameVal = elements.taskName.value.trim();
  
  if (!timeVal || !nameVal) return;
  
  const dateKey = formatDateKey(state.selectedDate);
  
  // 해당 날짜 배열 초기화
  if (!state.schedules[dateKey]) {
    state.schedules[dateKey] = [];
  }
  
  // 새 일정 개체 생성
  const newTask = {
    id: Date.now() + Math.floor(Math.random() * 1000), // 유니크 아이디 부여
    time: timeVal,
    task: nameVal,
    done: false,
    result: ''
  };
  
  // 일정 리스트 추가 및 시간 순서 정렬
  state.schedules[dateKey].push(newTask);
  state.schedules[dateKey].sort((a, b) => a.time.localeCompare(b.time));
  
  // 데이터 동기화
  saveSchedules();
  
  // 모달창 닫기
  closeAddTaskModal();
  
  // 뷰 갱신
  renderCalendar();
  renderTimeline();
  updateStats();
}

/**
 * 달력 렌더링
 */
function renderCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();

  elements.calendarTitle.textContent = `${year}년 ${month + 1}월`;
  elements.calendarDays.innerHTML = '';

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // 1. 이전 달 날짜 채우기
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cell = document.createElement('div');
    cell.className = 'day-cell prev-month';
    cell.textContent = dayNum;
    cell.addEventListener('click', () => {
      const prevDate = new Date(year, month - 1, dayNum);
      selectDate(prevDate);
    });
    elements.calendarDays.appendChild(cell);
  }

  // 2. 현재 달 날짜 채우기
  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.textContent = day;

    const cellDate = new Date(year, month, day);
    const dateKey = formatDateKey(cellDate);

    // 오늘 날짜 강조
    if (isSameDate(cellDate, state.today)) {
      cell.classList.add('today');
    }

    // 선택된 날짜 강조
    if (isSameDate(cellDate, state.selectedDate)) {
      cell.classList.add('selected');
    }

    // 일정이 1개 이상 존재하는 날짜에 미니 도트 뱃지 부여
    if (state.schedules[dateKey] && state.schedules[dateKey].length > 0) {
      cell.classList.add('has-events');
    }

    cell.addEventListener('click', () => selectDate(cellDate));
    elements.calendarDays.appendChild(cell);
  }

  // 3. 다음 달 날짜 채우기
  const currentTotalCells = startDayOfWeek + totalDays;
  const remainingCells = 42 - currentTotalCells;
  for (let day = 1; day <= remainingCells; day++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell next-month';
    cell.textContent = day;
    cell.addEventListener('click', () => {
      const nextDate = new Date(year, month + 1, day);
      selectDate(nextDate);
    });
    elements.calendarDays.appendChild(cell);
  }
}

/**
 * 특정 날짜 선택
 */
function selectDate(date) {
  state.selectedDate = new Date(date);
  state.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  renderCalendar();
  renderTimeline();
  updateStats();
}

/**
 * 타임라인 일정 목록 렌더링
 */
function renderTimeline() {
  const dateKey = formatDateKey(state.selectedDate);
  const year = state.selectedDate.getFullYear();
  const month = state.selectedDate.getMonth() + 1;
  const date = state.selectedDate.getDate();
  const dayName = koDays[state.selectedDate.getDay()];

  // 헤더 갱신
  elements.selectedDateTitle.textContent = `${year}년 ${month}월 ${date}일 ${dayName}`;
  
  if (isSameDate(state.selectedDate, state.today)) {
    elements.selectedDateStatus.textContent = '오늘 예정된 일정 목록입니다.';
    elements.goToTodayBtn.style.display = 'none';
  } else {
    elements.selectedDateStatus.textContent = `${month}월 ${date}일의 일정을 확인 및 편집 중입니다.`;
    elements.goToTodayBtn.style.display = 'flex';
  }

  // 타임라인 리스트 초기화
  elements.timelineList.innerHTML = '';

  const dayTasks = state.schedules[dateKey] || [];

  // 일정이 비어있는 경우 Empty State 표시
  if (dayTasks.length === 0) {
    elements.timelineList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2" />
          <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M3 10H21" stroke="currentColor" stroke-width="2" />
        </svg>
        <h4 class="empty-state-title">예정된 일정이 없습니다</h4>
        <p class="empty-state-desc">오른쪽 위의 '일정 등록' 버튼을 눌러 새로운 일정을 계획해 보세요.</p>
      </div>
    `;
    return;
  }

  // 각 일정을 화면에 렌더링
  dayTasks.forEach(task => {
    // 24시간 형식의 시간값을 보기 좋게 가공 (예: "09:30" -> "09:30 오전", "15:00" -> "03:00 오후")
    const [hourStr, minStr] = task.time.split(':');
    const hourVal = parseInt(hourStr);
    const ampm = hourVal < 12 ? '오전' : '오후';
    const displayHourNum = hourVal === 0 ? 12 : (hourVal > 12 ? hourVal - 12 : hourVal);
    const displayTimeStr = `${String(displayHourNum).padStart(2, '0')}:${minStr}`;

    const card = document.createElement('div');
    card.className = 'task-card';
    if (task.done) {
      card.classList.add('completed');
    }

    card.innerHTML = `
      <div class="task-card-time">
        <span>${displayTimeStr}</span>
        <span class="time-ampm">${ampm}</span>
      </div>
      <div class="task-card-details">
        <h4 class="task-card-title">${escapeHTML(task.task)}</h4>
        <div class="task-card-result-container">
          <span class="task-card-result-label">결과</span>
          <input type="text" class="task-card-result-input" placeholder="실행 결과 및 피드백 기록..." value="${escapeHTML(task.result || '')}">
        </div>
      </div>
      <div class="status-col">
        <label class="checkbox-container">
          <input type="checkbox" class="done-checkbox" ${task.done ? 'checked' : ''}>
          <span class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </label>
      </div>
      <div class="delete-col">
        <button class="btn-delete" aria-label="삭제" title="일정 삭제">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;

    // 요소 이벤트 수집 및 등록
    const doneCheckbox = card.querySelector('.done-checkbox');
    const resultInput = card.querySelector('.task-card-result-input');
    const deleteBtn = card.querySelector('.btn-delete');

    // 1. 체크 완료 토글
    doneCheckbox.addEventListener('change', () => {
      task.done = doneCheckbox.checked;
      if (task.done) {
        card.classList.add('completed');
      } else {
        card.classList.remove('completed');
      }
      saveSchedules();
      updateStats();
    });

    // 2. 결과 텍스트 실시간 저장
    resultInput.addEventListener('blur', () => {
      task.result = resultInput.value.trim();
      saveSchedules();
    });

    resultInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        resultInput.blur();
      }
    });

    // 3. 일정 삭제 처리
    deleteBtn.addEventListener('click', () => {
      if (confirm(`'${task.task}' 일정을 삭제하시겠습니까?`)) {
        // 해당 아이디 일정을 제외하고 필터링
        state.schedules[dateKey] = state.schedules[dateKey].filter(t => t.id !== task.id);
        
        // 날짜 배열이 비었다면 메모리 확보를 위해 해당 날짜 삭제
        if (state.schedules[dateKey].length === 0) {
          delete state.schedules[dateKey];
        }
        
        saveSchedules();
        
        // 새로고침 렌더링
        renderCalendar();
        renderTimeline();
        updateStats();
      }
    });

    elements.timelineList.appendChild(card);
  });
}

/**
 * XSS 공격 방지를 위한 HTML 이스케이프 유틸
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 일정 달성도 정보 업데이트
 */
function updateStats() {
  const dateKey = formatDateKey(state.selectedDate);
  const dayTasks = state.schedules[dateKey] || [];

  const totalTasksCount = dayTasks.length;
  const completedTasksCount = dayTasks.filter(item => item.done).length;

  if (isSameDate(state.selectedDate, state.today)) {
    elements.statsTitle.textContent = '오늘의 달성도';
  } else {
    elements.statsTitle.textContent = '선택일의 달성도';
  }

  elements.statsRatio.textContent = `${completedTasksCount} / ${totalTasksCount}`;

  // 프로그레스 바 계산
  const percent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  elements.progressBar.style.width = `${percent}%`;

  // 피드백 문구
  let feedbackMessage = '등록된 일정이 없습니다.';
  if (totalTasksCount > 0) {
    if (percent === 0) {
      feedbackMessage = '할 일을 시작해 보아요! 할 수 있습니다. 💪';
    } else if (percent < 40) {
      feedbackMessage = '차근차근 하나씩 해결해 나가요! 🔥';
    } else if (percent < 80) {
      feedbackMessage = '절반 가까이 해냈네요! 조금만 더 힘내세요! ✨';
    } else if (percent < 100) {
      feedbackMessage = '거의 다 왔어요! 마지막까지 파이팅! 🚀';
    } else {
      feedbackMessage = '모든 일정을 완수했습니다! 완벽한 하루군요! 🏆';
    }
  } else {
    if (isSameDate(state.selectedDate, state.today)) {
      feedbackMessage = '오늘 예정된 일정이 없습니다. 일정을 추가해 보세요.';
    } else {
      feedbackMessage = '이 날짜에 예정된 일정이 없습니다.';
    }
  }
  
  elements.statsText.textContent = feedbackMessage;
}

// 앱 구동 시작
document.addEventListener('DOMContentLoaded', init);
