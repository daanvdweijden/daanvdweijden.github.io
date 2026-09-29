---
title: "Estimating the Recommendation Certainty in Candidate-Based Voting Advice Applications"
authors:
  - Fynn Bachmann
  - Daan van der Weijden
  - Cristina Sarasua
  - Abraham Bernstein
date: 2026-01-21
venue: "Politics and Governance"
venueShort: "P&G"
type: Journal article
summary: "Most people quit voting advice questionnaires before finishing, so they never learn how reliable their early candidate matches are. A method that predicts their remaining answers estimates that reliability well, and showing people a simple preview of their likely matches kept them answering longer."
keyFindings:
  - "A method that simulates how a voter would answer the remaining questions estimates the accuracy of early candidate recommendations in a voting advice application to within 6.28% on average, compared with 10.22% for a linearly growing progress bar."
  - "In a user experiment, voting advice application users shown a preview of their likely candidate recommendations answered significantly more questions before quitting than a control group (68 vs 56 of 75 on average)."
  - "Voting advice application users shown an artificially inflated certainty score stopped answering sooner (49 questions on average) than users shown the real estimate (63), even though they said the display did not influence their decision."
  - "Voting advice application users understood a simple list of likely candidate matches significantly better than a version that also showed each candidate's match probability as a percentage."
figure:
  src: papers/figures/2026-recommendation-certainty-vaa.png
  caption: "Figure 2 from the paper: (a) error of methods that estimate how accurate a voting advice application's early candidate recommendations are, by number of questions answered out of 75. Methods that simulate the voter's remaining answers (Posterior, One-shot) err less than a linearly growing progress bar (Linear) or the historic average (Historic). (b) The true accuracy of each voter's early recommendations (grey lines) varies widely from voter to voter."
  alt: "Two line charts against number of questions answered. Left: estimation error for several methods, with the Posterior sampling lines lowest and Linear and Historic highest. Right: grey per-voter accuracy curves with average, linear and FastCRA lines on top."
file: 2026-recommendation-certainty-vaa.pdf
links:
  doi: 10.17645/pag.11256
bibtex: |
  @article{bachmann2026estimating,
    title={Estimating the Recommendation Certainty in Candidate-Based Voting Advice Applications},
    author={Bachmann, Fynn and van der Weijden, Daan and Sarasua, Cristina and Bernstein, Abraham},
    journal={Politics and Governance},
    volume={14},
    year={2026},
    doi={10.17645/pag.11256}
  }
draft: false
---

Voting advice applications typically require users to answer questionnaires before
receiving party or candidate recommendations. As users answer more questions, the
recommendations naturally become more accurate. However, when users do not
complete the questionnaire, the certainty of these recommendations is unknown. In
this work, we develop and present a measure to quantify this certainty by
introducing an algorithm that estimates the candidate recommendation accuracy—the
overlap between early and final recommendations—after each question.
