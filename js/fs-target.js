// ─── CSRI Transcript Analysis Tool — File System Target ───
// Allows user to pick a destination folder for exports (File System Access API)
// Falls back to standard browser download when API is unavailable

const FSTarget = {
  _dirHandle: null,
  _supported: typeof window.showDirectoryPicker === 'function',

  isSupported() {
    return this._supported;
  },

  hasFolder() {
    return this._dirHandle !== null;
  },

  getFolderName() {
    return this._dirHandle ? this._dirHandle.name : null;
  },

  async pickFolder() {
    if (!this._supported) return false;
    try {
      this._dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      this._updateUI();
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Folder picker error:', err);
      return false;
    }
  },

  clearFolder() {
    this._dirHandle = null;
    this._updateUI();
  },

  // Save a file — uses chosen folder if available, otherwise browser download
  async saveFile(blob, filename) {
    if (this._dirHandle) {
      try {
        const fileHandle = await this._dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return { method: 'folder', folder: this._dirHandle.name };
      } catch (err) {
        console.warn('Folder write failed, falling back to download:', err);
        // Permission may have been revoked — clear handle
        if (err.name === 'NotAllowedError') {
          this._dirHandle = null;
          this._updateUI();
        }
      }
    }
    // Fallback: standard download
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return { method: 'download' };
  },

  // Convenience: save text content
  async saveText(content, filename, mimeType) {
    const blob = new Blob([content], { type: (mimeType || 'text/plain') + ';charset=utf-8' });
    return this.saveFile(blob, filename);
  },

  _updateUI() {
    const row = document.getElementById('fsTargetRow');
    const label = document.getElementById('fsTargetLabel');
    const clearBtn = document.getElementById('fsTargetClear');
    if (!row) return;
    if (this._dirHandle) {
      label.textContent = this._dirHandle.name;
      label.title = this._dirHandle.name;
      clearBtn.style.display = '';
      row.classList.add('has-folder');
    } else {
      label.textContent = '';
      clearBtn.style.display = 'none';
      row.classList.remove('has-folder');
    }
  },

  init() {
    // Hide UI row if API not supported
    const row = document.getElementById('fsTargetRow');
    if (row && !this._supported) {
      row.style.display = 'none';
    }
  }
};
