import React from 'react';
import { useMutation } from '@apollo/client';

import { REMOVE_SKILL } from '../../utils/mutations';
import { QUERY_ME } from '../../utils/queries';

interface SkillsListProps {
  skills?: string[];
  isLoggedInUser: boolean;
}

const SkillsList: React.FC<SkillsListProps> = ({ skills = [], isLoggedInUser }) => {
  const [removeSkill, { error }] = useMutation
  (REMOVE_SKILL, {
    refetchQueries: [
      QUERY_ME,
      'me'
    ]
  });

  const handleRemoveSkill = async (skill: any) => {
    try {
      await removeSkill({
        variables: { skill },
      });
    } catch (err) {
      console.error(err);
    }
  };
  if (!skills.length) {
    return <h3>No Skills Yet</h3>;
  }

  return (
    <div>
      <div className="flex-row justify-space-between my-4">
        {skills &&
          skills.map((skill) => (
            <div key={skill} className="col-12 col-xl-6">
              <div className="card mb-3">
                <h4 className="card-header bg-dark text-light p-2 m-0 display-flex align-center">
                  <span>{skill}</span>
                  {isLoggedInUser && (
                    <button
                      className="btn btn-sm btn-danger ml-auto"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      X
                    </button>
                  )}
                </h4>
              </div>
            </div>
          ))}
      </div>
      {error && (
        <div className="my-3 p-3 bg-danger text-white">{error.message}</div>
      )}
    </div>
  );
};

export default SkillsList;
