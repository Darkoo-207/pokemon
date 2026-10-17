import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

const leer = (clave, defecto) => {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? defecto;
  } catch {
    return defecto;
  }
};

const mezclar = (arr) => [...arr].sort(() => Math.random() - 0.5);

function Coleccion() {
  const totalPokes = 1025;
  const [listaCapturados, setListaCapturados] = useState(() => {
    const guardados = leer('misNumeros', []);
    return Array.isArray(guardados) ? [...new Set(guardados.map(Number))] : [];
  });
  const [pokemones, setPokemones] = useState([]);
  const [ronda, setRonda] = useState(null); // { id, opciones: [ids], elegido: null | id }
  const [racha, setRacha] = useState(0);
  const [mejorRacha, setMejorRacha] = useState(() => leer('mejorRacha', 0));
  const navigate = useNavigate();
  const espacio = Array.from({ length: totalPokes }, (_, i) => i + 1);

  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
      .then((r) => r.json())
      .then((datos) => setPokemones(datos.results))
      .catch((e) => console.error('Error al cargar Pokémon:', e));
  }, []);

  const nuevaRonda = (capturados = listaCapturados) => {
    const pendientes = espacio.filter((id) => !capturados.includes(id));
    const pool = pendientes.length > 0 ? pendientes : espacio;
    const id = pool[Math.floor(Math.random() * pool.length)];

    const distractores = new Set();
    while (distractores.size < 3) {
      const otro = Math.floor(Math.random() * totalPokes) + 1;
      if (otro !== id) distractores.add(otro);
    }

    setRonda({ id, opciones: mezclar([id, ...distractores]), elegido: null });
  };

  useEffect(() => {
    if (pokemones.length > 0 && !ronda) nuevaRonda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemones]);

  const responder = (idElegido) => {
    if (!ronda || ronda.elegido !== null) return;
    setRonda({ ...ronda, elegido: idElegido });

    if (idElegido === ronda.id) {
      const nuevaRacha = racha + 1;
      setRacha(nuevaRacha);

      if (nuevaRacha > mejorRacha) {
        setMejorRacha(nuevaRacha);
        localStorage.setItem('mejorRacha', JSON.stringify(nuevaRacha));
      }

      if (!listaCapturados.includes(ronda.id)) {
        const actualizados = [...listaCapturados, ronda.id];
        setListaCapturados(actualizados);
        localStorage.setItem('misNumeros', JSON.stringify(actualizados));
      }
    } else {
      setRacha(0);
    }
  };

  const nombre = (id) => pokemones[id - 1]?.name || '';
  const acerto = ronda && ronda.elegido === ronda.id;
  const respondida = ronda && ronda.elegido !== null;

  return (
    <main className="coleccion">
      <h1 className="coleccion-titulo">¿Quién es ese Pokémon?</h1>
      <p className="coleccion-contador">
        {listaCapturados.length} <span>/ {totalPokes}</span>
      </p>

      <div className="quien-marcadores">
        <span>🔥 Racha: {racha}</span>
        <span>🏆 Mejor: {mejorRacha}</span>
      </div>

      {ronda && (
        <section className="quien-juego">
          <div className={`quien-imagen ${respondida ? 'revelado' : ''}`}>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${ronda.id}.png`}
              alt="Pokémon misterioso"
              width="180"
              height="180"
            />
          </div>

          {respondida && (
            <p className={acerto ? 'quien-mensaje acierto' : 'quien-mensaje fallo'}>
              {acerto
                ? `¡Correcto! ${nombre(ronda.id)} capturado`
                : `Era ${nombre(ronda.id)}`}
            </p>
          )}

          <div className="quien-opciones">
            {ronda.opciones.map((id) => {
              let clase = 'quien-opcion';
              if (respondida) {
                if (id === ronda.id) clase += ' correcta';
                else if (id === ronda.elegido) clase += ' incorrecta';
              }
              return (
                <button key={id} className={clase} disabled={respondida} onClick={() => responder(id)}>
                  {nombre(id)}
                </button>
              );
            })}
          </div>

          {respondida && (
            <button className="coleccion-boton" onClick={() => nuevaRonda()}>
              Siguiente
            </button>
          )}
        </section>
      )}

      <section className="coleccion-album">
        {espacio.map((id) => {
          const capturado = listaCapturados.includes(id);
          return (
            <div
              key={id}
              className={capturado ? 'coleccion-pokemon capturado' : 'coleccion-pokemon'}
              onClick={() => capturado && navigate(`/pokemon/${id}`)}
            >
              {capturado && (
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                  width="auto"
                  height="45"
                  loading="lazy"
                  alt={String(id)}
                />
              )}
              <p>{id}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}

export default Coleccion; 