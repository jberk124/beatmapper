import React from 'react';
import styled from 'styled-components';
import BaseLink from '../BaseLink';

import { COLORS, HEADER_HEIGHT, UNIT } from '../../constants';

import MaxWidthWrapper from '../MaxWidthWrapper';
import Logo from '../Logo';

const Header = () => {
  return (
    <Wrapper>
      <MaxWidthWrapper>
        <Contents>
          <Logo />
          <NavLinks>
            <HeaderLink to="/docs">Documentation</HeaderLink>
            <HeaderLink to="/dolphin-game">Dolphin Game</HeaderLink>
          </NavLinks>
        </Contents>
      </MaxWidthWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  height: ${HEADER_HEIGHT}px;
  line-height: ${HEADER_HEIGHT}px;
  background: ${COLORS.blueGray[900]};
`;

const Contents = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavLinks = styled.div`
  display: flex;
  gap: ${UNIT * 2}px;
`;

const HeaderLink = styled(BaseLink)`
  text-decoration: none;
  color: white;
  font-size: 16px;

  &:hover {
    text-decoration: underline;
  }
`;

export default Header;
