const STORAGE_KEY = 'minimal_todolist_items';

const CATEGORY_LABELS = {
  work: '工作',
  life: '生活',
};

const PRIORITY_CONFIG = {
  high: { label: 'High', weight: 3 },
  medium: { label: 'Medium', weight: 2 },
  low: { label: 'Low', weight: 1 },
};

const VALID_STATUSES = ['todo', 'process', 'done'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];

const EMPTY_COLUMN_HINTS = {
  todo: '尚無待處理事項（可將卡片拖曳至此）',
  process: '尚無進行中事項（可將卡片拖曳至此）',
  done: '尚無已完成事項（可將卡片拖曳至此）',
};

let todos = [];
let currentFilter = 'all';
let draggedTodoId = null;

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoAssignee = document.getElementById('todo-assignee');
const todoPriority = document.getElementById('todo-priority');
const todoCategory = document.getElementById('todo-category');
const remainingCountEl = document.getElementById('remaining-count');
const countAllEl = document.getElementById('count-all');
const countWorkEl = document.getElementById('count-work');
const countLifeEl = document.getElementById('count-life');
const filterTabs = document.querySelectorAll('.filter-tab');

const kanbanColumns = document.querySelectorAll('.kanban-column');
const columnLists = {
  todo: document.getElementById('list-todo'),
  process: document.getElementById('list-process'),
  done: document.getElementById('list-done'),
};
const columnCounts = {
  todo: document.getElementById('col-count-todo'),
  process: document.getElementById('col-count-process'),
  done: document.getElementById('col-count-done'),
};

/**
 * 取得優先程度權重 (High: 3 > Medium: 2 > Low: 1)
 * @param {string} priority
 * @returns {number}
 */
function getPriorityWeight(priority) {
  return PRIORITY_CONFIG[priority]?.weight ?? PRIORITY_CONFIG.medium.weight;
}

/**
 * 依優先程度排序陣列（高 → 中 → 低），同優先程度保持既有相對順序
 * @param {Array} list
 * @returns {Array}
 */
function sortByPriority(list) {
  return [...list].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
}

/**
 * 從 localStorage 載入待辦事項（自動相容舊版資料結構）
 */
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      todos = [];
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      todos = parsed.map((item) => {
        let status = item.status;
        if (!VALID_STATUSES.includes(status)) {
          status = item.completed ? 'done' : 'todo';
        }
        const priority = VALID_PRIORITIES.includes(item.priority) ? item.priority : 'medium';
        return {
          ...item,
          status,
          priority,
          completed: status === 'done',
        };
      });
      todos = sortByPriority(todos);
    } else {
      todos = [];
    }
  } catch (err) {
    console.error('無法讀取本地儲存的待辦事項:', err);
    todos = [];
  }
}

/**
 * 將待辦事項儲存至 localStorage
 */
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (err) {
    console.error('無法儲存待辦事項至本地:', err);
  }
}

/**
 * 新增待辦任務（預設進入 To-do 欄位，並依優先程度排序）
 * @param {string} text 任務內容
 * @param {string} assignee 負責人名稱
 * @param {'high' | 'medium' | 'low'} priority 優先程度
 * @param {'work' | 'life'} category 分類
 */
function addTodo(text, assignee, priority, category) {
  const cleanText = text.trim();
  if (!cleanText) return;

  const cleanAssignee = assignee.trim();
  const validPriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';
  const validCategory = category === 'life' ? 'life' : 'work';

  const newTodo = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: cleanText,
    assignee: cleanAssignee,
    priority: validPriority,
    category: validCategory,
    status: 'todo',
    completed: false,
    createdAt: Date.now(),
  };

  todos.unshift(newTodo);
  todos = sortByPriority(todos);
  saveTodos();
  render();
}

/**
 * 更新任務所在欄位狀態（拖曳放開後呼叫，並維持優先程度排序）
 * @param {string} id 任務 ID
 * @param {'todo' | 'process' | 'done'} newStatus 目標欄位狀態
 * @param {string | null} insertBeforeId 若拖曳在某張卡片上方，同優先級時可排在該卡片之前
 */
function moveTodoCard(id, newStatus, insertBeforeId = null) {
  if (!VALID_STATUSES.includes(newStatus)) return;

  const targetIndex = todos.findIndex((item) => item.id === id);
  if (targetIndex === -1) return;

  const [movedItem] = todos.splice(targetIndex, 1);
  movedItem.status = newStatus;
  movedItem.completed = newStatus === 'done';

  if (insertBeforeId && insertBeforeId !== id) {
    const beforeIndex = todos.findIndex((item) => item.id === insertBeforeId);
    if (beforeIndex !== -1) {
      todos.splice(beforeIndex, 0, movedItem);
    } else {
      todos.push(movedItem);
    }
  } else {
    todos.push(movedItem);
  }

  todos = sortByPriority(todos);
  saveTodos();
  render();
}

/**
 * 刪除指定任務
 * @param {string} id 任務 ID
 */
function deleteTodo(id) {
  todos = todos.filter((item) => item.id !== id);
  saveTodos();
  render();
}

/**
 * 設定分類篩選條件
 * @param {'all' | 'work' | 'life'} filterType
 */
function setFilter(filterType) {
  currentFilter = filterType;
  filterTabs.forEach((tab) => {
    const isActive = tab.dataset.filter === filterType;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  render();
}

/**
 * 更新頂部統計數量
 */
function updateTopCounts() {
  const remaining = todos.filter((t) => t.status !== 'done').length;
  const workCount = todos.filter((t) => t.category === 'work').length;
  const lifeCount = todos.filter((t) => t.category === 'life').length;

  remainingCountEl.textContent = String(remaining);
  countAllEl.textContent = String(todos.length);
  countWorkEl.textContent = String(workCount);
  countLifeEl.textContent = String(lifeCount);
}

/**
 * 建立單張可拖曳任務卡片 DOM
 * @param {object} item 任務物件
 * @returns {HTMLLIElement}
 */
function createCardElement(item) {
  const priorityKey = VALID_PRIORITIES.includes(item.priority) ? item.priority : 'medium';

  const li = document.createElement('li');
  li.className = `todo-card status-${item.status} prio-${priorityKey}`;
  li.dataset.id = item.id;
  li.draggable = true;

  // 卡片上方：任務文字 + 刪除按鈕
  const topDiv = document.createElement('div');
  topDiv.className = 'card-top';

  const textSpan = document.createElement('span');
  textSpan.className = 'todo-text';
  textSpan.textContent = item.text;

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-delete';
  deleteBtn.setAttribute('aria-label', `刪除「${item.text}」`);
  deleteBtn.title = '刪除任務';
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTodo(item.id);
  });

  topDiv.appendChild(textSpan);
  topDiv.appendChild(deleteBtn);

  // 卡片下方：優先程度標籤 + 分類標籤 + 負責人標籤 + 拖曳圖示提示
  const footerDiv = document.createElement('div');
  footerDiv.className = 'card-footer';

  const metaDiv = document.createElement('div');
  metaDiv.className = 'todo-meta';

  // 優先程度標籤
  const priorityBadge = document.createElement('span');
  priorityBadge.className = `badge badge-priority ${priorityKey}`;
  priorityBadge.textContent = PRIORITY_CONFIG[priorityKey].label;
  metaDiv.appendChild(priorityBadge);

  // 分類標籤
  const categoryBadge = document.createElement('span');
  const categoryKey = item.category === 'life' ? 'life' : 'work';
  categoryBadge.className = `badge badge-category ${categoryKey}`;
  categoryBadge.textContent = CATEGORY_LABELS[categoryKey];
  metaDiv.appendChild(categoryBadge);

  // 負責人標籤
  const assigneeBadge = document.createElement('span');
  assigneeBadge.className = 'badge badge-assignee';
  const assigneeName = item.assignee && item.assignee.trim() ? item.assignee.trim() : '未指派';
  assigneeBadge.textContent = `負責人：${assigneeName}`;
  metaDiv.appendChild(assigneeBadge);

  const dragHint = document.createElement('span');
  dragHint.className = 'drag-hint';
  dragHint.title = '可拖曳移動欄位';
  dragHint.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="9" cy="5" r="1"></circle>
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <circle cx="15" cy="19" r="1"></circle>
    </svg>
  `;

  footerDiv.appendChild(metaDiv);
  footerDiv.appendChild(dragHint);

  li.appendChild(topDiv);
  li.appendChild(footerDiv);

  // 綁定卡片拖曳事件
  li.addEventListener('dragstart', (event) => {
    draggedTodoId = item.id;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
    requestAnimationFrame(() => {
      li.classList.add('dragging');
    });
  });

  li.addEventListener('dragend', () => {
    draggedTodoId = null;
    li.classList.remove('dragging');
    kanbanColumns.forEach((col) => col.classList.remove('drag-over'));
  });

  return li;
}

/**
 * 根據滑鼠 Y 座標找出欄位中應該插入在哪張卡片之前
 * @param {HTMLElement} listContainer 欄位內的 ul 容器
 * @param {number} mouseY 滑鼠垂直座標
 * @returns {string | null} 目標卡片的 ID，若在最下方則回傳 null
 */
function getCardAfterDragPosition(listContainer, mouseY) {
  const draggableCards = [...listContainer.querySelectorAll('.todo-card:not(.dragging)')];

  let closestCard = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  draggableCards.forEach((card) => {
    const box = card.getBoundingClientRect();
    const offset = mouseY - box.top - box.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closestCard = card;
    }
  });

  return closestCard ? closestCard.dataset.id : null;
}

/**
 * 根據目前狀態渲染三個看板欄位（各欄位內依 High → Medium → Low 排序）
 */
function render() {
  updateTopCounts();

  const filteredTodos = todos.filter((item) => {
    if (currentFilter === 'all') return true;
    return item.category === currentFilter;
  });

  VALID_STATUSES.forEach((status) => {
    const listEl = columnLists[status];
    const countEl = columnCounts[status];
    listEl.innerHTML = '';

    const itemsInColumn = sortByPriority(
      filteredTodos.filter((item) => item.status === status)
    );
    countEl.textContent = String(itemsInColumn.length);

    if (itemsInColumn.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'column-empty';
      emptyLi.textContent = EMPTY_COLUMN_HINTS[status];
      listEl.appendChild(emptyLi);
      return;
    }

    itemsInColumn.forEach((item) => {
      const cardEl = createCardElement(item);
      listEl.appendChild(cardEl);
    });
  });
}

// 綁定三個欄位的拖曳放置事件 (DragOver / DragLeave / Drop)
kanbanColumns.forEach((column) => {
  const targetStatus = column.dataset.status;
  const listEl = columnLists[targetStatus];

  column.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    column.classList.add('drag-over');
  });

  column.addEventListener('dragleave', (event) => {
    if (!column.contains(event.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  });

  column.addEventListener('drop', (event) => {
    event.preventDefault();
    column.classList.remove('drag-over');

    const droppedId = draggedTodoId || event.dataTransfer.getData('text/plain');
    if (!droppedId) return;

    const insertBeforeId = getCardAfterDragPosition(listEl, event.clientY);
    moveTodoCard(droppedId, targetStatus, insertBeforeId);
  });
});

// 綁定表單送出事件
todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo(todoInput.value, todoAssignee.value, todoPriority.value, todoCategory.value);
  todoInput.value = '';
  todoAssignee.value = '';
  todoPriority.value = 'medium';
  todoInput.focus();
});

// 綁定分類篩選切換事件
filterTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setFilter(tab.dataset.filter);
  });
});

// 初始化應用程式
loadTodos();
render();
