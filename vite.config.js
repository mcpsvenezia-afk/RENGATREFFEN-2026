import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                contatti: resolve(__dirname, 'contatti.html'),
                iscrizioni: resolve(__dirname, 'iscrizioni.html'),
                regolamento: resolve(__dirname, 'regolamento.html'),
                team: resolve(__dirname, 'team.html'),
                timetable: resolve(__dirname, 'timetable.html'),
                tutorials: resolve(__dirname, 'tutorials.html'),
                sponsor: resolve(__dirname, 'sponsor.html'),
                race: resolve(__dirname, 'race-app.html'),
            },
        },
    },
})
