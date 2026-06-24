import { useParams } from 'react-router-dom';

function League() {
  const { id } = useParams();
  return <h1>League page — id: {id}</h1>;
}

export default League;