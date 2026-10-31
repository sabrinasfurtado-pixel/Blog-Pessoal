import { Link } from 'react-router-dom';
import homeLogo from '../../assets/home.jpeg';
import './Home.css';
import ListaPostagens from '../../components/postagens/listaPostagens/ListaPostagens';
import ModalPostagem from '../../components/postagens/modalPostagem/ModalPostagem';

function Home() {
    return (
        <>
            <div className="container" style={{ minHeight: 'calc(100vh - 120px)' }}>
                {/* 120px é a altura estimada do navbar + footer */}
                <div className="bg-orange-100 flex" style={{ fontFamily: 'Comic Sans MS'}}>
                    <div className='grid grid-cols-2 text-orange-500'>
                        <div className="flex flex-col gap-4 items-center justify-center py-4">
                            <h2 className='text-5xl font-ligth'>Bora Postar Algo!</h2>
                            <p className='text-xl'>Expresse aqui seus pensamentos e opiniões</p>
                            <div className="flex justify-around gap-4">
                                <ModalPostagem />
                                {/* Utilizando o componente Link para redirecionar para a página de postagens */}
                                <Link to="/postagens" className='rounded bg-orange-500 text-white py-2 px-4 hover:bg-orange-400 hover:text-white'>Ver postagens</Link>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <img src={homeLogo} alt="" className='w-2/3' />
                        </div>
                    </div>
                </div>
            </div>
            <ListaPostagens />
        </>
    );
}

export default Home;
