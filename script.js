const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const editedCount = document.getElementById("editedCount");
const deletedCount = document.getElementById("deletedCount");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// 🔑 Ensure every task has an originalIndex (for Reset baseline)
tasks.forEach((t, i) => {
  if (t.originalIndex === undefined) {
    t.originalIndex = i;
  }
});

let deletedCounter = 0;
let editedCounter = 0;

document.getElementById("deleteSelected").addEventListener("click", () => {
  const selected = tasks.filter(t => t.selected);
  if (selected.length && confirm(`Delete ${selected.length} tasks?`)) {
    tasks = tasks.filter(t => !t.selected);
    deletedCounter += selected.length;
    saveTasks();
    renderTasks();
  }
});

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addTask();
});

function saveTasks() {
  //  Only save tasks, no more originalTasks
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";
    li.draggable = true; // make draggable

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.selected || false;
    checkbox.addEventListener("change", () => {
      task.selected = checkbox.checked;
      saveTasks();
    });

    // Task text
    const span = document.createElement("span");
    span.textContent = task.text;
    // Desktop double-click
span.addEventListener("dblclick", () => editTask(index));

// Mobile tap-and-hold
let touchTimer;
span.addEventListener("touchstart", () => {
  touchTimer = setTimeout(() => {
    editTask(index); // enter edit mode after ~600ms hold
  }, 600);
});

span.addEventListener("touchend", () => {
  clearTimeout(touchTimer);
});

// Mobile double-tap
let lastTap = 0;
span.addEventListener("touchend", () => {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 300 && tapLength > 0) {
    editTask(index); // double-tap detected
  }
  lastTap = currentTime;
});


    // Action buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const completeBtn = document.createElement("button");
    completeBtn.textContent = "✔";
    completeBtn.addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✖";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete task: "${task.text}"?`)) {
        tasks.splice(index, 1);
        deletedCounter++;
        saveTasks();
        renderTasks();
      }
    });

    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    taskList.appendChild(li);

    // --- Drag and drop handlers ---
    li.addEventListener("dragstart", e => {
      e.dataTransfer.setData("index", index);
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging"); 
    });

    li.addEventListener("dragover", e => {
      e.preventDefault(); 
    });

    li.addEventListener("drop", e => {
  const fromIndex = e.dataTransfer.getData("index");
  const toIndex = index;

  const moved = tasks.splice(fromIndex, 1)[0];
  tasks.splice(toIndex, 0, moved);

  // ❌ Do not reset originalIndex here
  saveTasks();
  renderTasks();
});

  });

  // Update counters
  totalCount.textContent = tasks.length;
  completedCount.textContent = tasks.filter(t => t.completed).length;
  editedCount.textContent = editedCounter;
  deletedCount.textContent = deletedCounter;
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return alert("Task cannot be empty!");
  if (tasks.some(t => t.text.toLowerCase() === text.toLowerCase())) {
    return alert("Duplicate task not allowed!");
  }

  const newTask = { 
    text, 
    completed: false, 
    selected: false, 
    originalIndex: tasks.length // track insertion order
  };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
  taskInput.value = "";
}



function editTask(index) {
  const li = taskList.children[index];
  const span = li.querySelector("span");

  // Create input field
  const input = document.createElement("input");
  input.type = "text";
  input.value = tasks[index].text;
  input.className = "edit-input";

  // Replace span with input
  li.replaceChild(input, span);
  input.focus();

  // Save on Enter
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      saveEdit(index, input.value, li, input);
    }
  });

  // Save on blur (clicking away)
  input.addEventListener("blur", () => {
    saveEdit(index, input.value, li, input);
  });
}

function saveEdit(index, newText, li, input) {
  const trimmed = newText.trim();
  if (!trimmed) return; // prevent empty

  // Prevent duplicates
  if (tasks.some((t, i) => i !== index && t.text.toLowerCase() === trimmed.toLowerCase())) {
    alert("Duplicate task not allowed!");
    return;
  }

  tasks[index].text = trimmed;
  editedCounter++;
  saveTasks();

  // Restore span with dblclick listener
  const span = document.createElement("span");
  span.textContent = trimmed;
  span.addEventListener("dblclick", () => editTask(index));
  li.replaceChild(span, input);

  renderTasks();
}


function saveEdit(index, newText, li, input) {
  const trimmed = newText.trim();
  if (!trimmed) {
    alert("Task cannot be empty!");
    return;
  }
  // Prevent duplicates
  if (tasks.some((t, i) => i !== index && t.text.toLowerCase() === trimmed.toLowerCase())) {
    alert("Duplicate task not allowed!");
    return;
  }

  tasks[index].text = trimmed;
  editedCounter++;
  saveTasks();

  // Restore span
  const span = document.createElement("span");
  span.textContent = trimmed;
  span.addEventListener("dblclick", () => editTask(index));
  li.replaceChild(span, input);

  renderTasks();
}

document.getElementById("sortAsc").addEventListener("click", () => {
  tasks.sort((a, b) => a.text.localeCompare(b.text));
  renderTasks();
});
document.getElementById("sortDesc").addEventListener("click", () => {
  tasks.sort((a, b) => b.text.localeCompare(a.text));
  renderTasks();
});
document.getElementById("resetSort").addEventListener("click", () => {
  // Reset only the order, not deleted tasks
  tasks.sort((a, b) => a.originalIndex - b.originalIndex);
  renderTasks();
});


document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

renderTasks();







