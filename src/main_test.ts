import { supabase } from './lib/supabaseClient'

async function testConnection() {
    console.log('--- TEST_CONNECTION_v1 START ---')
    try {
        const { data, error } = await supabase.from('test').select('*')

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('not found')) {
                console.log('✅ TEST SUPERATO: Tabella "test" non trovata (404/PGRST116). Le chiavi sono corrette.')
            } else {
                console.error('❌ TEST FALLITO: Errore di connessione/autenticazione:', error)
            }
        } else {
            console.log('✅ TEST SUPERATO: Connessione riuscita (la tabella esiste):', data)
        }
    } catch (err) {
        console.error('❌ TEST FALLITO: Errore imprevisto:', err)
    }
    console.log('--- TEST_CONNECTION_v1 END ---')
}

testConnection()
