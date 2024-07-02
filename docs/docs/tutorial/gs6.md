---
id: gs5
title: Your second Gramble program
sidebar_label: Your second program
---

We'll use Swahili verbs for illustration.  Swahili is the first or second language for more than 100 million people in East Africa, and serves as a regional *lingua franca*.  Swahili verbs are fairly complex overall, but there *are* parts of the verb system that are relatively straightforward, and we'll start with those.  

The first thing to do before you start writing a program is **understand exactly what phenonemon you want to model**, so that you can make a plan.  Let's say our goal is modeling Swahili verbs in the present, perfect, and past tenses, with 1st, 2nd, and 3rd person (I, you, he/she/it) singular subjects.  They look like this:

| verb form | person | tense | English |
|-----------|--------|-------|---------|
| ninapenda | 1 | present | I love |
| unapenda | 2 | present | you love |
| anapenda | 3 | present | he/she/it loves |
| nilipenda | 1 | past | I loved |
| ulipenda | 2 | past | you loved |
| alipenda | 3 | past | he/she/it loved |
| nimependa | 1 | perfect | I have loved |
| umependa | 2 | perfect | you have loved |
| amependa | 3 | perfect | he/she/it has loved |

Study that table for a few minutes to get a good sense of what we need to model.  Do you notice any patterns?  Here are three patterns we can notice:

* All the 1st person subject forms start with ``ni``, all the 2nd person forms start with ``u``, and all the 3rd person forms start with ``a``.  
* After these subject markers, you find ``na`` in all the present forms, ``li`` in all the past forms, and ``me`` in all the perfect forms.
* All of these forms contain ``penda``, so presumably that means ``love``.  (Actually it's ``pend``, and it happens that all of these verb forms have a suffix ``a`` at the end.  Most verb forms end in ``a``, although a few conjugations end in ``i`` or ``e``.  We'll ignore that for now, though, and pretend the root is ``penda``.)

These word parts are called *morphemes*.  Speaking Swahili is a process of combining the appropriate morphemes, in the appropriate order, to get the correct verb form.  
