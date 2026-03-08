// src/lib/socketApi.js

export const emitTaskCreated = (socket, task) => {
  if (!socket) return;
  socket.emit('task_created', task);
};

export const emitTaskUpdated = (socket, task) => {
  if (!socket) return;
  socket.emit('task_updated', task);
};

export const emitTaskDeleted = (socket, taskId) => {
  if (!socket) return;
  socket.emit('task_deleted', taskId);
};

export const emitNoteCreated = (socket, note) => {
  if (!socket) return;
  socket.emit('note_created', note);
};

export const emitNoteUpdated = (socket, note) => {
  if (!socket) return;
  socket.emit('note_updated', note);
};

export const emitNoteDeleted = (socket, noteId) => {
  if (!socket) return;
  socket.emit('note_deleted', noteId);
};
