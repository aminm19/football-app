import { useParams } from 'react-router-dom';

function Team() {
  const { id } = useParams();
  return <h1>Team page — id: {id}</h1>;
}

export default Team;