---
title: "Bursting the Burden Bubble? An Assessment of Sharma et al.'s Counterfactual-based Fairness Metric"
authors:
  - Yochem van Rosmalen
  - Florian van der Steen
  - Sebastiaan Jans
  - Daan van der Weijden
date: 2022-11-21
venue: "Benelux Conference on Artificial Intelligence"
venueShort: "BNAIC '22"
type: Preprint
note: "Presented at BNAIC/BeNeLearn 2022"
summary: "Two ways of checking whether an AI model treats groups fairly can tell different stories. Burden, which measures how much rejected people would have to change to be accepted, catches unfairness that approval rates miss, and the two can disagree on who is disadvantaged."
keyFindings:
  - "On a synthetic dataset where both groups were approved at the same rate (statistical parity of 1.00), the Burden fairness metric still flagged unfairness: one group's Burden was 11.6 against 4.65 for the other."
  - "Burden and statistical parity can disagree about which group is treated unfairly: on a second synthetic dataset, statistical parity pointed to one group as disadvantaged while Burden pointed to the other."
  - "On a sample of the Taiwan credit-card default dataset, statistical parity between women and men was nearly met (1.02), yet women's Burden was almost 1.5 times that of men (1.38 vs 0.94)."
  - "Burden complements rather than replaces statistical parity, and it is far more expensive to compute, since generating a single counterfactual can take minutes."
file: 2022-bursting-burden-bubble.pdf
links:
  arxiv: https://arxiv.org/abs/2211.11512
  # The version in the BNAIC/BeNeLearn 2022 proceedings; the arXiv PDF is the
  # same paper, so linking both here would just duplicate the arXiv button.
  pdf: https://bnaic2022.uantwerpen.be/wp-content/uploads/BNAICBeNeLearn_2022_submission_4430.pdf
bibtex: |
  @article{van2022bursting,
    title={Bursting the Burden Bubble? An Assessment of Sharma et al.'s Counterfactual-based Fairness Metric},
    author={van Rosmalen, Yochem and van der Steen, Florian and Jans, Sebastiaan and van der Weijden, Daan},
    journal={arXiv preprint arXiv:2211.11512},
    year={2022}
  }
draft: false
---

Machine learning has seen an increase in negative publicity in recent years, due
to biased, unfair, and uninterpretable models. There is a rising interest in
making machine learning models more fair for unprivileged communities, such as
women or people of color. Metrics are needed to evaluate the fairness of a model.
A novel metric for evaluating fairness between groups is Burden, which uses
counterfactuals to approximate the average distance of negatively classified
individuals in a group to the decision boundary of the model. The goal of this
study is to compare Burden to statistical parity, a well-known fairness metric,
and discover Burden's advantages and disadvantages. We do this by calculating the
Burden and statistical parity of a sensitive attribute in three datasets: two
synthetic datasets are created to display differences between the two metrics,
and one real-world dataset is used. We show that Burden can show unfairness where
statistical parity can not, and that the two metrics can even disagree on which
group is treated unfairly. We conclude that Burden is a valuable metric, but does
not replace statistical parity: it rather is valuable to use both.
