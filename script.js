const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const editedCount = document.getElementById("editedCount");
const deletedCount = document.getElementById("deletedCount");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// 🔑 Ensure every task has an originalIndex (true baseline)
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
  // ✅ Only save tasks, no more originalTasks
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
    span.addEventListener("dblclick", () => editTask(index));

    // --- Mobile tap/hold/double-tap omitted for brevity, keep your existing code ---

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

      // ❌ Do not update originalIndex here
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
    originalIndex: tasks.length // baseline position
  };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
  taskInput.value = "";
}

function editTask(index) {
  const li = taskList.children[index];
  const span = li.querySelector("span");

  const input = document.createElement("input");
  input.type = "text";
  input.value = tasks[index].text;
  input.className = "edit-input";

  li.replaceChild(input, span);
  input.focus();

  input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      saveEdit(index, input.value, li, input);
    }
  });

  input.addEventListener("blur", () => {
    saveEdit(index, input.value, li, input);
  });
}

function saveEdit(index, newText, li, input) {
  const trimmed = newText.trim();
  if (!trimmed) {
    alert("Task cannot be empty!");
    return;
  }
  if (tasks.some((t, i) => i !== index && t.text.toLowerCase() === trimmed.toLowerCase())) {
    alert("Duplicate task not allowed!");
    return;
  }

  tasks[index].text = trimmed;
  editedCounter++;
  saveTasks();

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
