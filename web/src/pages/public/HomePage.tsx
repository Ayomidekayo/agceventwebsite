import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, CalendarDays, Clock3, Globe2, Handshake, HeartHandshake, Sparkles, TicketCheck, Users, Zap } from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';
import { api } from '../../lib/api';
import { EVENT_DATE, EVENT_TIME, EVENT_VENUE, formatEventDate, type PublicEventInfo } from '../../config/event';

function AnnouncementStrip() {
  return <div className="announcement-strip"><span className="live-dot" /> AGN 2027 · LAGOS ACTIVATION GLOBAL CONFERENCE <span className="announcement-divider">/</span> <span className="announcement-theme">FROM BLOCK TO BREAKTHROUGH</span></div>;
}

export default function HomePage() {
  const [days, setDays] = useState('—');
  const eventQuery = useQuery<PublicEventInfo>({ queryKey: ['public', 'event'], queryFn: async () => (await api.get('/public/event')).data, staleTime: 5 * 60_000, retry: false });
  const eventDate = eventQuery.data ? formatEventDate(eventQuery.data.eventDate) : EVENT_DATE;
  const eventTime = eventQuery.data?.startTime ?? EVENT_TIME;
  const eventVenue = eventQuery.data?.venue ?? EVENT_VENUE;
  useEffect(() => {
    const target = new Date('2027-02-27T09:00:00+01:00').getTime();
    const update = () => setDays(String(Math.max(0, Math.ceil((target - Date.now()) / 86_400_000))).padStart(3, '0'));
    update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer);
  }, []);
  return <PublicLayout>
    <AnnouncementStrip />
    <main>
      <section className="hero-section">
        <div className="hero-grain" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> A ROOM FOR WHAT'S NEXT</div>
            <h1>From block<br />to <span>breakthrough<span className="title-period">.</span></span></h1>
            <p className="hero-description">The moment you see beyond what is, you begin to build what could be. Join a gathering of young minds ready to grow, lead, create and move forward.</p>
            <div className="hero-buttons"><Link to="/register" className="button button-orange">Register your interest <ArrowUpRight size={18} /></Link><a href="#conference" className="button button-outline">Discover AGN <ArrowDownRight size={17} /></a></div>
            <div className="hero-proof"><div className="proof-avatars" aria-hidden="true"><span>A</span><span>G</span><span>N</span><span>+</span></div><div><strong>A community built for forward motion</strong><small>Leadership · Enterprise · Purpose</small></div></div>
          </div>
          <div className="hero-art-wrap">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="hero-art-label label-top"><span>01</span> SHIFT YOUR PERSPECTIVE</div>
            <div className="hero-art" aria-label="Abstract orange architectural forms representing transformation">
              <div className="art-disc disc-back" /><div className="art-block block-left" /><div className="art-block block-middle" /><div className="art-block block-right" /><div className="art-sun" /><div className="art-arrow"><span /></div><div className="art-glow" />
              <div className="art-stamp"><span>AGN</span><small>2027 / LAGOS</small></div>
            </div>
            <div className="hero-art-label label-bottom"><span className="label-asterisk">✳</span> BUILD BEYOND THE BLOCK</div>
            <span className="art-coordinate coordinate-one">06° 27′ N</span><span className="art-coordinate coordinate-two">03° 24′ E</span>
          </div>
        </div>
        <div className="hero-bottom container"><div className="event-meta"><CalendarDays size={17} /><span>{eventDate}</span><i /><Clock3 size={17} /><span>{eventTime}</span><i /><Globe2 size={17} /><span>Lagos, Nigeria</span></div><div className="countdown"><span className="countdown-number">{days}</span><span className="countdown-label">DAYS TO GO</span></div></div>
      </section>

      <section className="marquee-band" aria-label="Conference focus"><div className="marquee-track"><span>THINK DIFFERENTLY</span><Sparkles size={17} /><span>LEAD BOLDLY</span><Sparkles size={17} /><span>BUILD WITH PURPOSE</span><Sparkles size={17} /><span>MOVE FROM BLOCK TO BREAKTHROUGH</span><Sparkles size={17} /><span>THINK DIFFERENTLY</span><Sparkles size={17} /><span>LEAD BOLDLY</span><Sparkles size={17} /><span>BUILD WITH PURPOSE</span><Sparkles size={17} /></div></section>

      <section id="conference" className="section intro-section">
        <div className="container intro-grid">
          <div className="section-index"><span>01 / THE GATHERING</span><span className="index-rule" /></div>
          <div className="intro-content"><h2>A different kind of<br /><span>starting point.</span></h2><div className="intro-bottom"><p>AGN brings together emerging leaders, students, young professionals and entrepreneurs for a focused experience in mindset, leadership, business and enterprise. Not just another date on the calendar — a chance to challenge old limits and take a meaningful next step.</p><Link to="/register" className="text-link">Make your move <ArrowUpRight size={18} /></Link></div></div>
          <div className="intro-side-card"><span className="card-index">AGN / 2027</span><div className="side-card-symbol"><span /><span /><span /></div><h3>Potential is a beginning.<br />Action changes the story.</h3><p>One gathering. New perspectives. Practical next steps.</p><span className="side-card-bottom">LAGOS · NIGERIA</span></div>
        </div>
      </section>

      <section id="experience" className="section experience-section">
        <div className="container">
          <div className="section-heading-row"><div><div className="eyebrow"><span className="eyebrow-line" /> WHAT WE'RE HERE FOR</div><h2>Make room for<br /><span>what's possible.</span></h2></div><p>Great ideas matter. So do the people, tools and decisions that help turn them into something real.</p></div>
          <div className="experience-grid">
            <article className="experience-card experience-card-dark"><span className="experience-number">01</span><div className="experience-icon"><Zap size={23} /></div><h3>Mindset<br />& personal growth</h3><p>Challenge limiting patterns, build self-awareness and approach your next chapter with intention.</p><span className="experience-line" /></article>
            <article className="experience-card experience-card-orange"><span className="experience-number">02</span><div className="experience-icon"><Users size={23} /></div><h3>Leadership<br />& connection</h3><p>Learn alongside people who want to contribute, collaborate and create meaningful change.</p><span className="experience-line" /></article>
            <article className="experience-card experience-card-cream"><span className="experience-number">03</span><div className="experience-icon"><ArrowUpRight size={23} /></div><h3>Business<br />& enterprise</h3><p>Explore ideas, practical approaches and new ways to move from ambition into action.</p><span className="experience-line" /></article>
          </div>
        </div>
      </section>

      <section className="event-details-section"><div className="container details-grid"><div className="details-heading"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> PUT IT ON YOUR CALENDAR</div><h2>The next chapter<br />starts <span>here.</span></h2><p>Make space for a day of fresh thinking, new connections and purposeful action.</p><Link to="/register" className="button button-orange">Register your interest <ArrowUpRight size={18} /></Link></div><div className="details-list"><div className="detail-item"><span className="detail-symbol"><CalendarDays /></span><div><small>DATE</small><strong>{eventDate}</strong><p>Saturday</p></div><ArrowUpRight className="detail-arrow" size={18} /></div><div className="detail-item"><span className="detail-symbol"><Clock3 /></span><div><small>TIME</small><strong>{eventTime}</strong><p>Programme timing to be confirmed</p></div><ArrowUpRight className="detail-arrow" size={18} /></div><div className="detail-item"><span className="detail-symbol"><Globe2 /></span><div><small>VENUE</small><strong>{eventVenue}</strong><p>{eventQuery.data?.venueStatus === 'CONFIRMED' ? 'Confirmed event venue' : 'Subject to final event confirmation'}</p></div><ArrowUpRight className="detail-arrow" size={18} /></div></div></div></section>

      <section className="section get-involved-section"><div className="container"><div className="section-heading-row involvement-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR PLACE IN THE STORY</div><h2>Breakthrough is<br /><span>built together.</span></h2></div><p>There are different ways to be part of the movement. Choose the one that fits your next step.</p></div><div className="involvement-grid"><Link to="/register" className="involvement-card involvement-register"><span className="involvement-kicker">FOR PARTICIPANTS</span><TicketCheck size={28} /><h3>Take your seat.</h3><p>Join the room, explore new perspectives and take away your next step.</p><span className="involvement-action">Register for AGN <ArrowUpRight size={18} /></span><span className="involvement-ghost">01</span></Link><Link to="/sponsorship" className="involvement-card involvement-sponsor"><span className="involvement-kicker">FOR PARTNERS</span><Handshake size={28} /><h3>Back the breakthrough.</h3><p>Help make a development-focused experience accessible to more young people.</p><span className="involvement-action">Explore sponsorship <ArrowUpRight size={18} /></span><span className="involvement-ghost">02</span></Link><Link to="/volunteer" className="involvement-card involvement-volunteer"><span className="involvement-kicker">FOR VOLUNTEERS</span><HeartHandshake size={28} /><h3>Bring your energy.</h3><p>Contribute your time, skills and perspective to a shared experience.</p><span className="involvement-action">Become a volunteer <ArrowUpRight size={18} /></span><span className="involvement-ghost">03</span></Link></div></div></section>

      <section className="closing-section"><div className="container closing-inner"><span className="closing-mark">AGN<span>✳</span></span><div><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> THIS IS YOUR INVITATION</div><h2>Don't just imagine<br />the next chapter.<br /><span>Step into it.</span></h2></div><Link to="/register" className="button button-light">I'm in <ArrowUpRight size={18} /></Link><div className="closing-ring" /></div></section>
    </main>
  </PublicLayout>;
}
