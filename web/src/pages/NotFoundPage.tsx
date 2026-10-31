import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';

export default function NotFoundPage() { return <PublicLayout><main className="not-found container"><span className="eyebrow"><span className="eyebrow-line"/> LOST YOUR WAY?</span><h1>This isn't<br/><span>the breakthrough.</span></h1><p>The page you are looking for could not be found.</p><Link to="/" className="button button-dark">Back to home <ArrowRight size={17}/></Link></main></PublicLayout>; }
