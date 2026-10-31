import { GithubLogo, LinkedinLogo } from '@phosphor-icons/react'
import React, { useContext } from 'react'
import { AuthContext } from '../../contexts/AuthContext'

function Footer() {

  const { usuario } = useContext(AuthContext)

  let footerComponent

  const data = new Date().getFullYear()

  if (usuario.token !== '') {
    footerComponent = (
      <div className="bg-orange-500 text-white" style={{ fontFamily: 'Comic Sans MS', paddingTop: 0 , paddingBottom: 0 }}>
        <div className="container flex flex-col items-center py-4">
          <p className='text-xl font-ligth'>Blog pessoal de Sabrina S. Furtado | Copyright: {data}</p>
          <p className='text-lg font-ligth'>Acesse meu linkedin e Github</p>
          <div className='flex gap-2'>
            <a href="https://www.linkedin.com/in/sabrina-dos-santos-furtado-67374a185/" target="_blank" rel="noopener noreferrer">
              <LinkedinLogo size={48} />
            </a>
            <a href="https://github.com/SabrinaFurtado" target="_blank" rel="noopener noreferrer">
              <GithubLogo size={48} />
            </a>
          </div>
        </div>
      </div>
    )
  }
  

  return (
    <>
      {footerComponent}
    </>
  )
}

export default Footer
