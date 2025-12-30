'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{padding:16}}>
      <h2>Wystąpił błąd.</h2>
      <p>{error?.message || 'Unknown error'}</p>
      <pre style={{whiteSpace:'pre-wrap'}}>{error?.digest}</pre>
      <button onClick={() => reset()} style={{marginTop:8}}>Spróbuj ponownie</button>
    </div>
  );
}
