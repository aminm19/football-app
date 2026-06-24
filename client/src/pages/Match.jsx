import { useParams } from 'react-router-dom';

function Match() {
  const { id } = useParams();
  return <h1>Match page — id: {id}</h1>;
}

export default Match;