"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

export type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
};

type FilterState = {
  query: string;
  status: "all" | "active" | "completed";
  priority: "all" | "low" | "medium" | "high";
  sort: "created" | "due" | "title" | "priority";
};

const LOCAL_STORAGE_KEY = "agentic_todo_tasks";

const defaultFilter: FilterState = {
  query: "",
  status: "all",
  priority: "all",
  sort: "created"
};

const priorityRank: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2
};

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as Task["priority"]
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Task[];
      if (Array.isArray(parsed)) {
        setTasks(parsed);
      }
    } catch (error) {
      console.error("Failed to parse stored tasks", error);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => {
        if (filter.status === "active" && task.completed) return false;
        if (filter.status === "completed" && !task.completed) return false;
        if (filter.priority !== "all" && task.priority !== filter.priority) {
          return false;
        }
        if (filter.query.trim()) {
          const term = filter.query.toLowerCase();
          return (
            task.title.toLowerCase().includes(term) ||
            task.description.toLowerCase().includes(term)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (filter.sort === "title") {
          return a.title.localeCompare(b.title);
        }
        if (filter.sort === "priority") {
          return priorityRank[a.priority] - priorityRank[b.priority];
        }
        if (filter.sort === "due") {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [tasks, filter]);

  const completedCount = tasks.filter((task) => task.completed).length;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : undefined,
      priority: draft.priority
    };
    setTasks((prev) => [newTask, ...prev]);
    setDraft({ title: "", description: "", dueDate: "", priority: "medium" });
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  return (
    <main className={styles.main}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>To-Do List</h1>
          <p className={styles.subtitle}>Capture, prioritize, and track your tasks.</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="title">
              Task Name
            </label>
            <input
              id="title"
              name="title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Write a clear, actionable task"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="description">
              Details
            </label>
            <textarea
              id="description"
              name="description"
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Add context, links, or steps"
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.inlineFields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="dueDate">
                Due date
              </label>
              <input
                id="dueDate"
                type="date"
                value={draft.dueDate}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dueDate: event.target.value }))
                }
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                value={draft.priority}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, priority: event.target.value as Task["priority"] }))
                }
                className={styles.input}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            Add Task
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.statusSummary}>
            <span>
              {completedCount} of {tasks.length} completed
            </span>
            {completedCount > 0 && (
              <button type="button" className={styles.linkButton} onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </div>
          <div className={styles.controls}>
            <input
              type="search"
              placeholder="Search"
              value={filter.query}
              onChange={(event) => setFilter((prev) => ({ ...prev, query: event.target.value }))}
              className={styles.searchInput}
            />
            <select
              value={filter.status}
              onChange={(event) =>
                setFilter((prev) => ({ ...prev, status: event.target.value as FilterState["status"] }))
              }
              className={styles.select}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filter.priority}
              onChange={(event) =>
                setFilter((prev) => ({
                  ...prev,
                  priority: event.target.value as FilterState["priority"]
                }))
              }
              className={styles.select}
            >
              <option value="all">Any priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filter.sort}
              onChange={(event) =>
                setFilter((prev) => ({ ...prev, sort: event.target.value as FilterState["sort"] }))
              }
              className={styles.select}
            >
              <option value="created">Newest</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        <ul className={styles.taskList}>
          {filteredTasks.length === 0 && (
            <li className={styles.emptyState}>
              <p>No tasks yet. Add your first item to get started.</p>
            </li>
          )}
          {filteredTasks.map((task) => (
            <li key={task.id} className={styles.taskRow}>
              <div className={styles.taskHeader}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={task.completed}
                    onChange={(event) =>
                      updateTask(task.id, { completed: event.target.checked })
                    }
                  />
                  <span className={styles.checkmark} />
                </label>
                <div className={styles.taskTitleGroup}>
                  <div className={styles.taskTitleLine}>
                    <h2 className={`${styles.taskTitle} ${task.completed ? styles.completed : ""}`}>
                      {task.title}
                    </h2>
                    <span className={`${styles.priorityBadge} ${styles[`priority_${task.priority}`]}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                  {task.description && <p className={styles.taskDescription}>{task.description}</p>}
                  <div className={styles.metaRow}>
                    <span>Created {new Date(task.createdAt).toLocaleString()}</span>
                    {task.dueDate && (
                      <span>
                        Due {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.taskActions}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() =>
                    updateTask(task.id, {
                      priority:
                        task.priority === "high"
                          ? "medium"
                          : task.priority === "medium"
                          ? "low"
                          : "high"
                    })
                  }
                >
                  Cycle priority
                </button>
                <button type="button" className={styles.dangerButton} onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
