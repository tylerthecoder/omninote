import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'
import styles from './App.module.css'
import { Today } from './Today.tsx'
import { AllDays } from './PastDays.tsx'
import { TodoList } from './TodoList.tsx'
import { BuyList } from './BuyList.tsx'

function App() {
  return (
    <Router>
      <div className={styles.root}>
        <div className={styles.sidebar}>
          <ul className={styles.sidebarList}>
            <li className={styles.sidebarItem}><Link to="/" className={styles.sidebarLink}>Today</Link></li>
            <li className={styles.sidebarItem}><Link to="/past-days" className={styles.sidebarLink}>Past Days</Link></li>
            <li className={styles.sidebarItem}><Link to="/todos" className={styles.sidebarLink}>All Todos</Link></li>
            <li className={styles.sidebarItem}><Link to="/buy-list" className={styles.sidebarLink}>Buy List</Link></li>
          </ul>
        </div>
        <div className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/past-days" element={<AllDays />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="/buy-list" element={<BuyList />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
