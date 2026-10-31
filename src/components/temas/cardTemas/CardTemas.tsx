//import React from 'react'
import { Link } from 'react-router-dom'
import Tema from '../../../models/Tema'

interface CardTemaProps {
  tema: Tema
}

function CardTemas({tema}: CardTemaProps) {
  return (
    <div className='border flex flex-col rounded-2xl overflow-hidden justify-between bg-orange-500' style={{ fontFamily: 'Comic Sans MS'}}>
      <header className='py-2 px-6 bg-orange-500 text-white font-light text-2xl'>Tema</header>
      <p className='p-8 text-3xl bg-orange-100 text-orange-500 h-full'>{tema.descricao}</p>
      <div className="flex">
        <Link to={`/editarTema/${tema.id}`} className='w-full text-white bg-orange-500 hover:bg-orange-400 flex items-center justify-center py-2'>
          <button>Editar</button>
        </Link>
        <Link to={`/deletarTema/${tema.id}`} className='text-slate-100 bg-red-500 hover:bg-red-400 w-full flex items-center justify-center'>
          <button>Deletar</button>
        </Link>
      </div>
    </div>
  )
}

export default CardTemas