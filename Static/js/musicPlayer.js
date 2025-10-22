class MusicPlayer {
  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.volume = 0.1;
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.playlist = [
      { filename: "Nerdout! - I'm a Watch Dog.mp3", title: "I'm a Watch Dog", artist: 'NerdOut', genre: 'Rock' },
      { filename: 'Dual Core - All The Things.mp3', title: 'All The Things', artist: 'Dual Core', genre: 'Hip-Hop/Rap' },
      { filename: 'deadmau5 - Antisec.mp3', title: 'Antisec', artist: 'Deadmau5 ft YTCracker', genre: 'Electronic' },
      { filename: 'Dual Core - 0x0A Hack Commandments.mp3', title: '0x0A Hack Commandments', artist: 'Dual Core', genre: 'Hip-Hop/Rap' }
    ];

    // Elements (check these IDs exist in your HTML)
    this.playerElement = document.getElementById('music-player');
    this.playPauseBtn = document.getElementById('play-pause');
    this.nextBtn = document.getElementById('next-song');
    this.prevBtn = document.getElementById('prev-song');
    this.progressBar = document.getElementById('progress-bar'); // can be <div> or <progress>
    this.titleElement = document.getElementById('song-title');
    this.artistElement = document.getElementById('song-artist');
    this.genreElement = document.getElementById('song-genre');
    this.minimizedTitle = document.querySelector('.minimized-title');

    // Basic sanity checks
    if (!this.playerElement) console.error('music-player element (#music-player) not found');
    if (!this.playPauseBtn) console.error('play/pause button (#play-pause) not found');
    if (!this.nextBtn) console.error('next button (#next-song) not found');
    if (!this.progressBar) console.warn('progress bar (#progress-bar) not found — progress updates will be skipped');

    this.initEventListeners();
    this.loadStateFromStorage();
    this.initMinimizeFeature();

    // Try autoplay (with unmute fallback on user interaction)
    this.attemptAutoplayWithFallback();
  }

  initEventListeners() {
    if (this.playPauseBtn) this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextSong());
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevSong());

    this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
    this.audioElement.addEventListener('ended', () => this.nextSong());

    // Unmute on first user gesture if we started muted for autoplay
    const unmuteHandler = () => {
      if (this.audioElement && this.audioElement.muted) {
        this.audioElement.muted = false;
        console.log('MusicPlayer: unmuted audio after user interaction');
      }
      window.removeEventListener('click', unmuteHandler);
      window.removeEventListener('keydown', unmuteHandler);
      window.removeEventListener('touchstart', unmuteHandler);
    };
    window.addEventListener('click', unmuteHandler);
    window.addEventListener('keydown', unmuteHandler);
    window.addEventListener('touchstart', unmuteHandler);
  }

  initMinimizeFeature() {
    if (!this.playerElement) return;
    this.playerElement.addEventListener('mouseenter', () => {
      this.playerElement.classList.remove('minimized');
    });
    this.playerElement.addEventListener('mouseleave', () => {
      this.playerElement.classList.add('minimized');
    });
    this.updateMinimizedTitle();
  }

  loadStateFromStorage() {
    try {
      const savedState = localStorage.getItem('musicPlayerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.currentTrackIndex = Number.isInteger(state.currentTrackIndex) ? state.currentTrackIndex : 0;
        this.audioElement.currentTime = state.currentTime || 0;
        this.isPlaying = !!state.isPlaying;
      }
    } catch (e) {
      console.warn('Failed to parse saved state:', e);
    }
    this.loadTrack(this.currentTrackIndex);
    this.updatePlayPauseUI();
  }

  saveStateToStorage() {
    const state = {
      currentTrackIndex: this.currentTrackIndex,
      isPlaying: this.isPlaying,
      currentTime: this.audioElement.currentTime
    };
    try {
      localStorage.setItem('musicPlayerState', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save music player state:', e);
    }
  }

  loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    const track = this.playlist[index];
    // verify or adjust path as needed; this is based on your earlier code
    this.audioElement.src = `/Static/playlist/${track.filename}`;
    this.titleElement && (this.titleElement.textContent = track.title);
    this.artistElement && (this.artistElement.textContent = track.artist || '');
    this.genreElement && (this.genreElement.textContent = track.genre || '');
    this.currentTrackIndex = index;
    this.updateMinimizedTitle();
    this.saveStateToStorage();
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
    } else {
      this.audioElement.play().catch(err => {
        console.warn('Playback error:', err);
        // If autoplay blocked, keep UI consistent but allow user to click to play
      });
      this.isPlaying = true;
    }
    this.updatePlayPauseUI();
    this.saveStateToStorage();
  }

  updatePlayPauseUI() {
    if (!this.playPauseBtn) return;
    // Use Font Awesome icons (keeps your HTML markup)
    if (this.isPlaying) {
      this.playPauseBtn.innerHTML = 'Pause';
    } else {
      this.playPauseBtn.innerHTML = 'Play';
    }
  }

  nextSong() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadTrack(this.currentTrackIndex);
    if (this.isPlaying) {
      this.audioElement.play().catch(err => console.warn(err));
    }
  }

  prevSong() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(this.currentTrackIndex);
    if (this.isPlaying) {
      this.audioElement.play().catch(err => console.warn(err));
    }
  }

  updateProgress() {
    if (!this.progressBar) return;
    const duration = this.audioElement.duration || 0;
    const current = this.audioElement.currentTime || 0;
    const percent = duration > 0 ? (current / duration) * 100 : 0;

    // If progressBar is a <progress>, update value attribute
    if (this.progressBar.tagName && this.progressBar.tagName.toLowerCase() === 'progress') {
      this.progressBar.value = percent;
    } else {
      // Otherwise treat it as div and use width style (backward compatible)
      this.progressBar.style.width = `${percent}%`;
    }
    this.saveStateToStorage();
  }

  updateMinimizedTitle() {
    if (!this.minimizedTitle) return;
    const currentTrack = this.playlist[this.currentTrackIndex] || {};
    this.minimizedTitle.textContent = `Now Playing: ${currentTrack.title || ''}`;
  }

  // Attempt autoplay, if blocked try muted autoplay then wait for user gesture to unmute
  attemptAutoplayWithFallback() {
    // try normal autoplay first
    this.audioElement.muted = false;
    this.audioElement.play().then(() => {
      this.isPlaying = true;
      this.updatePlayPauseUI();
      console.log('Autoplay succeeded (unmuted).');
    }).catch((err) => {
      console.warn('Autoplay failed unmuted — trying muted autoplay:', err);
      // Try muted autoplay (more likely to succeed)
      this.audioElement.muted = true;
      this.audioElement.play().then(() => {
        this.isPlaying = true;
        this.updatePlayPauseUI();
        console.log('Autoplay succeeded (muted). Will unmute on first user interaction.');
      }).catch(err2 => {
        console.warn('Muted autoplay also failed:', err2);
        // leave player paused; user can press play
        this.isPlaying = false;
        this.updatePlayPauseUI();
      });
    });
  }
}

// Initialize player after DOM loads
function createPlayer() {
  window.musicPlayer = new MusicPlayer();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPlayer);
} else {
  createPlayer();
}