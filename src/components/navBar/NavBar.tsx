import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const { usuario, handleLogout } = useContext(AuthContext);

  function logout() {
    handleLogout();
    alert('Usuário deslogado com sucesso');
    navigate('/login');
  }

  let navbarComponent = null;

  if (usuario.token !== "") {
    navbarComponent = (
      <div className="bg-orange-500 text-white" style={{ fontFamily: 'Comic Sans MS', paddingTop: 0 , paddingBottom: 0 }}>
        <div className="container flex justify-between items-center px-4">
          <div className="flex items-center gap-4">
            <img src='/src/assets/S.jpeg' className='h-12 rounded-full' alt="" />
            <Link to='/home' className='text-2xl font-ligth uppercase'>Blog Pessoal</Link>
          </div>
          <div className='flex gap-4'>
            <Link to='/postagens' className='hover:underline'>Postagens</Link>
            <Link to='/temas' className='hover:underline'>Temas</Link>
            <Link to='/cadastroTema' className='hover:underline'>Cadastrar tema</Link>
            <Link to='/perfil' className='hover:underline'>Perfil</Link>
            <Link to='' onClick={logout} className='hover:underline'>Sair</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {navbarComponent}
    </>
  );
}

export default Navbar;
