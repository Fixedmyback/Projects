const API_BASE_URL = 'http://localhost:5000/api';

// Utility functions
const DateUtils = {
    format: (date) => {
        const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },
    getMonthName: (idx) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][idx],
    getDayName: (idx) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx],
    isSameDay: (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear(),
    isToday: (date) => DateUtils.isSameDay(date, new Date()),
    isWeekend: (date) => [0, 6].includes(date.getDay())
};

const API = {
    get: async (path) => {
        const res = await fetch(`${API_BASE_URL}${path}`);
        return res.ok ? res.json() : null;
    },
    post: async (path, data) => {
        const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.ok ? res.json() : null;
    },
    put: async (path, data) => {
        const res = await fetch(`${API_BASE_URL}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.ok ? res.json() : null;
    },
    delete: async (path) => {
        const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' });
        return res.ok;
    }
};

const notify = (msg, type = 'info') => { console.log(`[${type.toUpperCase()}] ${msg}`); alert(msg); };

const escapeHtml = (text) => { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; };

class CalendarApp {
    constructor() {
        this.$ = {
            monthYear: document.getElementById('monthYear'),
            calendarGrid: document.getElementById('calendarGrid'),
            weekdaysContainer: document.getElementById('weekdaysContainer'),
            prevMonth: document.getElementById('prevMonth'),
            nextMonth: document.getElementById('nextMonth'),
            todayBtn: document.getElementById('todayBtn'),
            newEventBtn: document.getElementById('newEventBtn'),
            selectedDateTitle: document.getElementById('selectedDateTitle'),
            eventsList: document.getElementById('eventsList'),
            notesTextarea: document.getElementById('notesTextarea'),
            saveNotesBtn: document.getElementById('saveNotesBtn'),
            eventModal: document.getElementById('eventModal'),
            eventForm: document.getElementById('eventForm'),
            eventTitle: document.getElementById('eventTitle'),
            eventDate: document.getElementById('eventDate'),
            eventTime: document.getElementById('eventTime'),
            eventDescription: document.getElementById('eventDescription'),
            closeModalBtn: document.getElementById('closeModal'),
            cancelBtn: document.getElementById('cancelBtn'),
            deleteBtn: document.getElementById('deleteBtn'),
            modalTitle: document.getElementById('modalTitle')
        };

        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = {};
        this.notes = {};
        this.weekdays = [];
        this.editingEventId = null;
        this.noteSaveTimer = null;

        this.bindEvents();
        this.init();
    }

    bindEvents() {
        this.$.prevMonth.addEventListener('click', () => this.previousMonth());
        this.$.nextMonth.addEventListener('click', () => this.nextMonth());
        this.$.todayBtn.addEventListener('click', () => this.goToToday());
        this.$.newEventBtn.addEventListener('click', () => this.openEventModal());
        this.$.eventForm.addEventListener('submit', (e) => this.submitEvent(e));
        this.$.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.$.cancelBtn.addEventListener('click', () => this.closeModal());
        this.$.deleteBtn.addEventListener('click', () => this.deleteEvent());
        this.$.eventModal.addEventListener('click', (e) => e.target === this.$.eventModal && this.closeModal());
        this.$.notesTextarea?.addEventListener('input', () => this.scheduleNoteSave());
        this.$.saveNotesBtn?.addEventListener('click', () => this.saveNoteNow());
    }

    async init() {
        try {
            const weekdaysData = await API.get('/calendar/weekdays');
            this.weekdays = weekdaysData?.weekdays || [];

            const eventsData = await API.get('/events');
            this.events = eventsData?.reduce((acc, e) => (acc[e.id] = e, acc), {}) || {};

            this.notes = await API.get('/notes') || {};

            this.renderWeekdays();
            this.render();
            this.selectDate(new Date());
        } catch (err) {
            console.error('Init error:', err);
            notify('Failed to load calendar', 'error');
        }
    }

    renderWeekdays() {
        this.$.weekdaysContainer.innerHTML = this.weekdays.map(day => `<div class="weekday">${day.substring(0, 3)}</div>`).join('');
    }

    render() {
        this.$.monthYear.textContent = `${DateUtils.getMonthName(this.currentDate.getMonth())} ${this.currentDate.getFullYear()}`;
        this.renderCalendar();
    }

    renderCalendar() {
        this.$.calendarGrid.innerHTML = '';
        const year = this.currentDate.getFullYear(), month = this.currentDate.getMonth();
        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) this.addDayElement(daysInPrevMonth - i, true, null);
        for (let day = 1; day <= daysInMonth; day++) this.addDayElement(day, false, new Date(year, month, day));
        for (let day = 1; day <= 42 - this.$.calendarGrid.children.length; day++) this.addDayElement(day, true, null);
    }

    addDayElement(day, isOther, date) {
        const el = document.createElement('div');
        el.className = 'calendar-day';

        if (!isOther) {
            if (DateUtils.isToday(date)) el.classList.add('today');
            if (this.selectedDate && DateUtils.isSameDay(date, this.selectedDate)) el.classList.add('selected');
            if (DateUtils.isWeekend(date)) el.classList.add('weekend');
        } else {
            el.classList.add('other-month');
        }

        el.innerHTML = `<div class="calendar-day-number">${day}</div>`;

        if (!isOther && date) {
            const dayEvents = Object.values(this.events).filter(e => e.date === DateUtils.format(date));
            if (dayEvents.length > 0) {
                const dots = '<div class="calendar-day-events">' + dayEvents.slice(0, 3).map(() => '<span class="event-dot"></span>').join('') + (dayEvents.length > 3 ? ` +${dayEvents.length - 3}` : '') + '</div>';
                el.innerHTML += dots;
            }
            el.addEventListener('click', () => this.selectDate(date));
        }

        this.$.calendarGrid.appendChild(el);
    }

    selectDate(date) {
        this.selectedDate = date;
        this.render();
        this.renderEvents();
        this.renderNotes();
    }

    renderEvents() {
        if (!this.selectedDate) {
            this.$.eventsList.innerHTML = '<p class="empty-state">Select a date to view events</p>';
            return;
        }

        const dateStr = DateUtils.format(this.selectedDate);
        this.$.selectedDateTitle.textContent = `${DateUtils.getDayName(this.selectedDate.getDay())}, ${DateUtils.getMonthName(this.selectedDate.getMonth())} ${this.selectedDate.getDate()}`;

        const dayEvents = Object.entries(this.events)
            .filter(([_, e]) => e.date === dateStr)
            .sort((a, b) => (a[1].time || '').localeCompare(b[1].time || ''));

        if (dayEvents.length === 0) {
            this.$.eventsList.innerHTML = '<p class="empty-state">No events for this day</p>';
            return;
        }

        this.$.eventsList.innerHTML = dayEvents.map(([id, e]) =>
            `<div class="event-item" onclick="app.openEventModal('${id}')">
                ${e.time ? `<div class="event-item-time">${e.time}</div>` : ''}
                <div class="event-item-title">${escapeHtml(e.title)}</div>
                ${e.description ? `<div class="event-item-description">${escapeHtml(e.description)}</div>` : ''}
            </div>`
        ).join('');
    }

    renderNotes() {
        if (!this.selectedDate || !this.$.notesTextarea) return;
        this.$.notesTextarea.value = this.notes[DateUtils.format(this.selectedDate)] || '';
    }

    openEventModal(id = null) {
        this.editingEventId = id || null;
        this.$.modalTitle.textContent = id ? 'Edit Event' : 'New Event';
        this.$.deleteBtn.style.display = id ? 'block' : 'none';

        if (id && this.events[id]) {
            const e = this.events[id];
            this.$.eventTitle.value = e.title;
            this.$.eventDate.value = e.date;
            this.$.eventTime.value = e.time || '';
            this.$.eventDescription.value = e.description || '';
        } else {
            this.$.eventForm.reset();
            this.$.eventDate.value = DateUtils.format(this.selectedDate || new Date());
        }

        this.$.eventModal.classList.add('active');
    }

    closeModal() {
        this.$.eventModal.classList.remove('active');
        this.$.eventForm.reset();
        this.editingEventId = null;
    }

    async submitEvent(e) {
        e.preventDefault();

        const data = {
            title: this.$.eventTitle.value.trim(),
            date: this.$.eventDate.value,
            time: this.$.eventTime.value,
            description: this.$.eventDescription.value.trim()
        };

        if (!data.title) {
            notify('Please enter an event title', 'error');
            return;
        }

        try {
            const result = this.editingEventId
                ? await API.put(`/events/${this.editingEventId}`, data)
                : await API.post('/events', data);

            if (result) {
                this.events[result.id] = result;
                notify(`Event ${this.editingEventId ? 'updated' : 'created'} successfully`, 'success');
                this.closeModal();
                this.selectDate(this.selectedDate);
            }
        } catch (err) {
            console.error('Event submit error:', err);
            notify('Failed to save event', 'error');
        }
    }

    async deleteEvent() {
        if (!this.editingEventId || !confirm('Delete this event?')) return;

        try {
            if (await API.delete(`/events/${this.editingEventId}`)) {
                delete this.events[this.editingEventId];
                notify('Event deleted successfully', 'success');
                this.closeModal();
                this.selectDate(this.selectedDate);
            }
        } catch (err) {
            console.error('Delete error:', err);
            notify('Failed to delete event', 'error');
        }
    }

    scheduleNoteSave() {
        clearTimeout(this.noteSaveTimer);
        this.noteSaveTimer = setTimeout(() => this.saveNoteNow(), 1000);
    }

    async saveNoteNow() {
        clearTimeout(this.noteSaveTimer);
        if (!this.selectedDate || !this.$.notesTextarea) return;

        const dateStr = DateUtils.format(this.selectedDate);
        const content = this.$.notesTextarea.value;

        try {
            if (await API.post(`/notes/${dateStr}`, { content })) {
                this.notes[dateStr] = content;
                notify('Note saved successfully', 'success');
            }
        } catch (err) {
            console.error('Save note error:', err);
        }
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectDate(new Date());
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CalendarApp();
});
