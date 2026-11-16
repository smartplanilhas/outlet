import React from 'react';
import { Composition } from 'remotion';
import { ReelsComposition, type ReelsProps } from './ReelsComposition';
import { ImagemComposition, type ImagemProps } from './ImagemComposition';

const DEFAULT_PROPS: ReelsProps = {
  descricao:        'Airfryer Digital 4L',
  fotoStaticFile:   null,
  fotoUrl:          null,
  preco:            89.90,
  precoInternet:    199.90,
  vantagens:        ['Sem óleo', 'Pronta em 12 min'],
  cta:              ['venha_loja', 'whatsapp'],
  unidadeUnica:     false,
  abertura:         'preco_primeiro',
  roteiro: {
    textos_tela: {
      abertura:   'OLHA ESSE PREÇO!',
      vantagens:  ['Sem óleo', 'Pronta em 12 min'],
      chamada:    ['Venha à loja', 'Chama no WhatsApp'],
    },
  },
  tempos:           [],
  audioStaticFile:  null,
  audioUrl:         null,
  durationInFrames: 270,
};

const DEFAULT_IMAGEM: ImagemProps = {
  descricao:        'Airfryer Digital 4L',
  fotoStaticFile:   null,
  fotoUrl:          null,
  preco:            89.90,
  precoInternet:    199.90,
  vantagens:        ['Sem óleo', 'Pronta em 12 min'],
  cta:              ['venha_loja'],
  unidadeUnica:     false,
  roteiro:          { textos_tela: { chamada: ['Venha à loja'] } },
};

export const Root: React.FC = () => (
  <>
  <Composition
    id="ImagemComposition"
    component={ImagemComposition}
    durationInFrames={1}
    fps={30}
    width={1080}
    height={1080}
    defaultProps={DEFAULT_IMAGEM}
  />
  <Composition
    id="ReelsComposition"
    component={ReelsComposition}
    durationInFrames={270}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={DEFAULT_PROPS}
    calculateMetadata={({ props }) => ({
      durationInFrames: (props as ReelsProps).durationInFrames ?? 270,
    })}
  />
  </>
);
