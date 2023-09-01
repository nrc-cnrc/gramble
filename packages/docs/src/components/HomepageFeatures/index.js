import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const features = [
  {
    title: <>Easy to read and write</>,
    //imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Gramble lets non-programmers develop rule-based linguistic programs,
        without having to embark on a second career as a computer scientist.
      </>
    ),
  },
  {
    title: <>Get the whole team involved</>,
    //imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Gramble + Google Sheets means easy online collaboration. Everyone can edit the same
        document at the same time. 
      </>
    ),
  },
  {
    title: <>Easy to embed in your site</>,
    //imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        Gramble is plain JavaScript, so it can easily embed in a webpage.  Node, React, and Apps Script
        flavors are available as well!
      </>
    ),
  },
];


const FeatureList = [
  {
    title: 'Easy to read and write',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Gramble lets non-programmers develop linguistic programs,
        without having to embark on a second career as a computer scientist.
      </>
    ),
  },
  {
    title: 'Get the whole team involved',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Gramble + Google Sheets means easy online collaboration. Everyone can edit the same
        document at the same time. 
      </>
    ),
  },
  {
    title: 'Easy to embed in your site',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Gramble is plain JavaScript, so it can easily embed in a webpage.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
