import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Row, Col } from '@freecodecamp/react-bootstrap';
import { StripeProvider, Elements } from 'react-stripe-elements';

import {
  amountsConfig,
  durationsConfig,
  modalDefaultStateConfig
} from '../../../../config/donation-settings';
import { stripePublicKey } from '../../../../config/env.json';
import { stripeScriptLoader } from '../../utils/scriptLoaders';
import DonateFormChildViewForHOC from './DonateFormChildViewForHOC';
import DonateCompletion from './DonateCompletion';
import { userSelector } from '../../redux';

import './Donation.css';

const propTypes = {
  defaultTheme: PropTypes.string,
  handleProcessing: PropTypes.func,
  isDonating: PropTypes.bool,
  stripe: PropTypes.shape({
    createToken: PropTypes.func.isRequired
  })
};

const mapStateToProps = createSelector(
  userSelector,
  ({ isDonating }) => ({
    isDonating
  })
);

const initialState = {
  donationState: {
    processing: false,
    success: false,
    error: ''
  }
};

class MinimalDonateForm extends Component {
  constructor(...args) {
    super(...args);

    this.durations = durationsConfig;
    this.amounts = amountsConfig;

    this.state = {
      ...modalDefaultStateConfig,
      ...initialState,
      isDonating: this.props.isDonating,
      stripe: null
    };
    this.handleStripeLoad = this.handleStripeLoad.bind(this);
    this.onDonationStateChange = this.onDonationStateChange.bind(this);
    this.resetDonation = this.resetDonation.bind(this);
  }

  componentDidMount() {
    if (window.Stripe) {
      this.handleStripeLoad();
    } else if (document.querySelector('#stripe-js')) {
      document
        .querySelector('#stripe-js')
        .addEventListener('load', this.handleStripeLoad);
    } else {
      stripeScriptLoader(this.handleStripeLoad);
    }
  }

  componentWillUnmount() {
    const stripeMountPoint = document.querySelector('#stripe-js');
    if (stripeMountPoint) {
      stripeMountPoint.removeEventListener('load', this.handleStripeLoad);
    }
  }

  handleStripeLoad() {
    // Create Stripe instance once Stripe.js loads
    if (stripePublicKey) {
      this.setState(state => ({
        ...state,
        stripe: window.Stripe(stripePublicKey)
      }));
    }
  }

  resetDonation() {
    return this.setState({ ...initialState });
  }

  onDonationStateChange(success, processing, error) {
    this.setState(state => ({
      ...state,
      donationState: {
        ...state.donationState,
        processing: processing,
        success: success,
        error: error
      }
    }));
  }

  renderCompletion(props) {
    return <DonateCompletion {...props} />;
  }

  render() {
    const { donationAmount, donationDuration, stripe } = this.state;
    const { handleProcessing, defaultTheme } = this.props;
    const {
      donationState: { processing, success, error }
    } = this.state;
    if (processing || success || error) {
      return this.renderCompletion({
        processing,
        success,
        error,
        reset: this.resetDonation
      });
    }

    return (
      <Row>
        <Col sm={10} smOffset={1} xs={12}>
          <StripeProvider stripe={stripe}>
            <Elements>
              <DonateFormChildViewForHOC
                defaultTheme={defaultTheme}
                donationAmount={donationAmount}
                donationDuration={donationDuration}
                getDonationButtonLabel={() =>
                  `Confirm your donation of $5 / month`
                }
                handleProcessing={handleProcessing}
              />
            </Elements>
          </StripeProvider>
        </Col>
      </Row>
    );
  }
}

MinimalDonateForm.displayName = 'MinimalDonateForm';
MinimalDonateForm.propTypes = propTypes;

export default connect(
  mapStateToProps,
  null
)(MinimalDonateForm);
