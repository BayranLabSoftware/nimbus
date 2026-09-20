import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { BUILD_INFO, commitUrl, shortCommit } from '../../buildInfo.js';
import type { EventType } from '../../store/index.js';
import styles from './SimulatorPanel.module.css';

/**
 * What drew these numbers, at the foot of the panel.
 *
 * The commit and the laws are in the printed report already, which is
 * where a number leaves the application — but a reader deciding whether
 * to believe what is on screen is looking at the screen, not at a PDF
 * they have not asked for yet. A tool that wants to be cited keeps its
 * provenance in sight.
 *
 * The laws named here are the ones that draw the headline quantities of
 * each event, the same ones `reportCitations.ts` prints in full. They are
 * a short form, not a bibliography: the report is the bibliography, and
 * the commit is the link between the two.
 */

const LAWS: Record<EventType, string> = {
  earthquake: 'Boore 2014 · Worden 2012 · PAGER',
  impact: 'Collins 2005 · Glasstone & Dolan',
  explosion: 'Glasstone & Dolan 1977 · Kingery & Bulmash',
  volcano: 'Mastin 2009 · Bonadonna 2005',
  landslide: 'Ward & Day 2002 · Heim',
};

export function ProvenanceBar({ eventType }: { eventType: EventType }): JSX.Element {
  const { t } = useTranslation();
  const commit = BUILD_INFO.commit;
  return (
    <div className={styles.provenanceBar}>
      <span>{LAWS[eventType]}</span>
      {commit === null ? (
        <span>{t('simulator.provenance.noCommit')}</span>
      ) : (
        <a href={commitUrl(commit)} target="_blank" rel="noreferrer">
          {shortCommit(commit)}
          {BUILD_INFO.dirty ? '+' : ''}
        </a>
      )}
    </div>
  );
}
