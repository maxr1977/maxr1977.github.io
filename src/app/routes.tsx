import { devRoutes } from 'virtual:portfolio-dev-routes'
import { Route, Routes } from 'react-router'
import { DatenschutzPage } from '../pages/DatenschutzPage'
import { HomePage } from '../pages/HomePage'
import { ImpressumPage } from '../pages/ImpressumPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectPage } from '../pages/ProjectPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { SiteLayout } from './SiteLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="projekte" element={<ProjectsPage />} />
        <Route path="projekte/:slug" element={<ProjectPage />} />
        <Route path="impressum" element={<ImpressumPage />} />
        <Route path="datenschutz" element={<DatenschutzPage />} />
        {devRoutes}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
