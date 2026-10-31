import { Link } from 'react-router-dom';

type BrandProps = { inverse?: boolean };

export default function Brand({ inverse = false }: BrandProps) {
  return (
    <Link className={`brand ${inverse ? 'brand-inverse' : ''}`} to="/" aria-label="AGN home">
      <span className="brand-symbol" aria-hidden="true"><span /><span /><span /></span>
      <span className="brand-copy"><strong>AGN</strong><small>ACTIVATION GLOBAL NETWORK</small></span>
    </Link>
  );
}
