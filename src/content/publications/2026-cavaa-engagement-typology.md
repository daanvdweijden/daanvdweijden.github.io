---
title: "Towards a Typology of User Engagement in Conversational Agent Voting Advice Applications"
authors:
  - Daan van der Weijden
  - Thilo Ignaz Dieing
  - Fynn Bachmann
date: 2026-07-21
venue: "ACM Conference on Conversational User Interfaces (CUI '26), Bremen, Germany"
venueShort: "CUI '26"
type: Conference paper
note: "Equal Author Contribution"
award: "Best Poster Honorable Mention"
summary: "People using a chatbot-based voting advice tool fell into three groups: those checking a choice they had already made, undecided voters seeking guidance, and people testing the chatbot itself. The group didn't predict who finished; the chatbot's behaviour did, as follow-up questions made people quit earlier."
keyFindings:
  - "Among 189 users of a GPT-based chatbot voting advice tool for the 2024 European Parliament elections, three behaviour-based user types emerged: Checkers (65.6%), Seekers (20.6%) and Testers (13.8%)."
  - "Testers, users who probe a voting advice chatbot's limits instead of seeking advice, have no direct counterpart in earlier typologies of traditional voting advice application users, while Checkers and Seekers resemble existing types."
  - "Only 51.9% of users of the chatbot voting advice tool answered all ten statements, and user type did not significantly predict completion, although Testers had the lowest full completion rate (34.6%)."
  - "A voting advice chatbot persona that asked follow-up questions after each answer led users to complete far fewer statements than a passive one (5.60 vs 9.25 of 10 on average), so users dropped out 3 to 4 statements earlier."
figure:
  src: papers/figures/2026-cavaa-engagement-typology.png
  caption: "Figure 1 from the paper: the ten conversational features that most distinguish each type of user of a chatbot voting advice tool, as standardised difference from the overall mean. Checkers (n=124) mostly give answers and statements, Seekers (n=39) ask about party ideology and political knowledge, and Testers (n=26) ask for the chatbot's own opinion and go off topic."
  alt: "Three diverging bar charts, one each for Checkers, Seekers and Testers, showing features above the average in orange and below the average in blue."
file: 2026-cavaa-engagement-typology.pdf
links:
  doi: 10.1145/3816046.3816272
bibtex: |
  @inproceedings{vanderweijden2026towards,
    title={Towards a Typology of User Engagement in Conversational Agent Voting Advice Applications},
    author={van der Weijden, Daan and Dieing, Thilo Ignaz and Bachmann, Fynn},
    booktitle={Proceedings of the ACM Conference on Conversational User Interfaces (CUI '26)},
    year={2026},
    location={Bremen, Germany},
    numpages={7},
    publisher={Association for Computing Machinery},
    doi={10.1145/3816046.3816272}
  }
draft: false
---

Voting Advice Applications (VAAs) help citizens align with political parties, but
are limited by frequent comprehension problems. Conversational Agent VAAs
(CAVAAs) address this by integrating chatbot-based support. Yet, user interaction
patterns and their effects on completing the CAVAA remain underexplored. This
study identifies behavior-based CAVAA user types and examines their interaction
with chatbot personas. Using interaction data from 189 users of an GPT-driven
CAVAA during the 2024 European Parliament elections, a Latent Class Analysis
reveals three types: Checkers (low interaction), Seekers (high engagement and
uncertainty), and Testers (system probing rather than advice seeking). While user
types do not predict completion, the chatbot personas significantly did. We find
that the more active chatbot (asking follow-up questions) increased dropout rates.
Our analysis introduces a novel behavioral typology and highlights the importance
of conversational design for reducing dropout and improving CAVAA effectiveness.
